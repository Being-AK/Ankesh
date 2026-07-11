import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, 
  Send, 
  Shield, 
  Globe, 
  Paperclip, 
  X, 
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { sendMessageToGemini } from '../../services/geminiService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'msg-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
  image?: string;
  isTyping?: boolean;
}

export default function AIAssistantWorkspace() {
  const [isDecrypting, setIsDecrypting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDecrypting(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome-message',
      role: 'model', 
      text: "👋 Welcome to **Ankesh AI Professional Workspace**! I am your dedicated compliance & tax intelligence terminal.\n\nUse this secure workspace to analyze GST notices, calculate tax computations, outline corporate incorporation guidelines, or draft MCA board resolutions. How can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef(false);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const suggestedTemplates = [
    {
      title: "Statutory Deadlines",
      category: "ROC / MCA",
      prompt: "What are the annual MCA filing requirements, board meeting rules, and compliance deadlines for an Indian Private Limited Company?",
      icon: <Clock size={16} className="text-amber-500" />
    },
    {
      title: "Statutory Audit Guide",
      category: "Audit & Assurance",
      prompt: "Provide a comprehensive statutory audit program and checklist for verifying trade payables, fixed assets, and revenue recognition under Indian Accounting Standards.",
      icon: <Briefcase size={16} className="text-blue-500" />
    },
    {
      title: "GST Export Procedure",
      category: "Indirect Taxation",
      prompt: "Explain the complete legal process and documentation required for exporting services from India under LUT (Letter of Undertaking) and claiming GST refunds.",
      icon: <Globe size={16} className="text-emerald-500" />
    },
    {
      title: "Board Resolution Draft",
      category: "Corporate Law",
      prompt: "Draft a professional corporate Board Resolution approving the opening of a new current bank account and authorizing directors to operate it.",
      icon: <BookOpen size={16} className="text-purple-500" />
    }
  ];

  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorMsg(null);
      errorTimerRef.current = null;
    }, 5000);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size === 0) {
        triggerError("The selected file is empty. Please select a valid image.");
        return;
      }

      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
      if (file.size > MAX_FILE_SIZE) {
        triggerError("File is too large. Maximum allowed size is 5MB.");
        return;
      }

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        triggerError("Unsupported format. Please select a PNG, JPG, JPEG, or WEBP image.");
        return;
      }
      
      setAttachedImage(file);
      setErrorMsg(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setImagePreview(event.target.result);
        }
      };
      reader.onerror = () => {
        triggerError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const finalQuery = textToSend !== undefined ? textToSend : inputValue.trim();
    if ((!finalQuery && !attachedImage) || isLoading || isGeneratingRef.current) return;

    setInputValue('');
    const currentPreview = imagePreview;
    const currentImageFile = attachedImage;
    
    setAttachedImage(null);
    setImagePreview(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    isGeneratingRef.current = true;
    setIsLoading(true);

    const history = messages.map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }]
    }));

    const userMsgId = generateId();
    const typingMsgId = generateId();
    
    setMessages(prev => [
      ...prev, 
      { 
        id: userMsgId,
        role: 'user', 
        text: finalQuery || "Analyzed attached document", 
        image: currentPreview || undefined 
      },
      {
        id: typingMsgId,
        role: 'model',
        text: '',
        isTyping: true
      }
    ]);

    try {
      let imageParam = undefined;
      if (currentImageFile && currentPreview) {
        const commaIndex = currentPreview.indexOf(',');
        if (commaIndex !== -1) {
          const mimeType = currentImageFile.type;
          const data = currentPreview.substring(commaIndex + 1);
          imageParam = { mimeType, data };
        }
      }

      const response = await sendMessageToGemini(
        finalQuery || "Please analyze this compliance document, invoice, notice, or financial statement.", 
        history, 
        imageParam
      );

      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].isTyping) {
          newMessages[lastIndex] = {
            id: newMessages[lastIndex].id,
            role: 'model',
            text: response.text,
            sources: response.sources
          };
        } else {
          newMessages.push({
            id: generateId(),
            role: 'model',
            text: response.text,
            sources: response.sources
          });
        }
        return newMessages;
      });
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].isTyping) {
          newMessages[lastIndex] = {
            id: newMessages[lastIndex].id,
            role: 'model',
            text: "I apologize, but an unexpected system error occurred. Please try sending your inquiry again."
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        id: 'welcome-message',
        role: 'model', 
        text: "👋 Welcome to **Ankesh AI Professional Workspace**! I am your dedicated compliance & tax intelligence terminal.\n\nUse this secure workspace to analyze GST notices, calculate tax computations, outline corporate incorporation guidelines, or draft MCA board resolutions. How can I assist you today?"
      }
    ]);
    setAttachedImage(null);
    setImagePreview(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-130px)] flex flex-col lg:flex-row bg-light dark:bg-darkBg transition-colors duration-300 relative overflow-hidden">
      
      <AnimatePresence>
        {isDecrypting && (
          <motion.div
            key="portal-entrance"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              filter: "blur(20px)",
              scale: 1.05,
              transition: { duration: 0.6, ease: "easeInOut" } 
            }}
            className="absolute inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Dynamic Futuristic Radar Scanner Grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(15,23,42,0)_0%,rgba(2,6,23,0.85)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.2)_1px,transparent_1px)] bg-[size:32px_32px]" />
            
            {/* Pulsing glow ray overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-corporate/10 to-gold/10 rounded-full blur-3xl opacity-60 animate-pulse-slow" />

            <div className="relative z-10 max-w-sm w-full flex flex-col items-center">
              
              {/* Spinning Quantum Auditing Node Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                {/* Outermost dotted rotating orbit */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-corporate/30"
                />
                {/* Middle gradient spinning bracket */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-t-2 border-b-2 border-l border-gold/40"
                />
                {/* Inner central shining core */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-slate-900 border border-gold/30 flex items-center justify-center shadow-2xl shadow-gold/10"
                >
                  <Sparkles size={24} className="text-gold animate-pulse" />
                </motion.div>
              </div>

              {/* Glowing Scanlines */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none"
              />

              <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-2 font-mono">
                Initializing Secure Terminal
              </h4>
              
              <p className="text-xs text-slate-400 font-mono mb-6">
                Establishing local sandbox pipeline...
              </p>

              {/* Glowing auditable pipeline percentage tracker */}
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-corporate via-orange-500 to-gold rounded-full"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 font-mono">
                <Shield size={12} className="text-corporate" />
                <span>End-To-End Encrypted Audit Core</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar: Presets and Guidance */}
      <div className="w-full lg:w-80 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 p-6 flex flex-col gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gold/10 p-1.5 rounded-lg border border-gold/20 flex items-center justify-center">
              <Shield size={16} className="text-gold" />
            </div>
            <h3 className="font-extrabold text-navy dark:text-white text-base">Compliance Intelligence</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Execute professional tax research, double-entry bookkeeping checks, and compliance study audits securely.
          </p>
        </div>

        {/* Dynamic Action Presets */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Query Templates
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {suggestedTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(template.prompt)}
                disabled={isLoading}
                className="text-left bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold p-3.5 rounded-2xl shadow-sm transition-all duration-200 flex flex-col gap-1.5 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                    {template.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    {template.category}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
                    {template.title}
                  </span>
                  <ArrowRight size={12} className="text-slate-400 group-hover:text-corporate dark:group-hover:text-gold transform group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System Settings / Utilities */}
        <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-350 rounded-xl transition-all duration-300 cursor-pointer outline-none"
          >
            <RefreshCw size={13} />
            <span>Reset Chat Session</span>
          </button>
        </div>
      </div>

      {/* Main Panel: Conversation Terminal */}
      <div className="flex-1 flex flex-col bg-white dark:bg-darkBg relative min-w-0">
        
        {/* Workspace Title Ribbon */}
        <div className="py-4 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-darkBg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div>
            <h1 className="text-lg font-black text-navy dark:text-white flex items-center gap-2">
              Ankesh AI Terminal
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sandbox
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise-grade tax and audit query analysis powered by Gemini 3.5 Flash.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 px-3 py-1.5 rounded-xl">
            <Shield size={13} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Secure Sandbox Environment
            </span>
          </div>
        </div>

        {/* Messages Log area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        >
          {messages.map((msg) => {
            if (msg.isTyping) {
              return (
                <div key={msg.id} className="flex justify-start max-w-3xl animate-pulse">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 px-5 py-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              );
            }

            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] lg:max-w-[75%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-gradient-to-tr from-indigo-600 to-corporate dark:from-gold dark:to-amber-500 text-white dark:text-slate-950 font-medium rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                }`}>
                  {msg.image && (
                    <div className="mb-3 max-w-full overflow-hidden rounded-2xl border border-white/20 dark:border-slate-800">
                      <img 
                        src={msg.image} 
                        alt="Uploaded document preview" 
                        className="max-h-64 object-contain w-full rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans font-medium">{msg.text}</div>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200 font-sans font-medium">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-800 dark:text-slate-200 font-sans font-medium">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-800 dark:text-slate-200 font-sans font-medium">{children}</ol>,
                          li: ({ children }) => <li className="pl-0.5 leading-relaxed text-slate-800 dark:text-slate-200 font-sans font-medium">{children}</li>,
                          strong: ({ children }) => <strong className="font-extrabold text-slate-950 dark:text-white">{children}</strong>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-corporate dark:text-gold hover:underline font-bold break-all outline-none"
                            >
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="bg-slate-100 dark:bg-slate-950 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-xs font-bold border border-slate-200/50 dark:border-slate-800/50">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1 select-none">
                        <Globe size={11} className="text-slate-400 dark:text-gold" /> Search References Checked:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <a 
                            key={`${msg.id}-src-${sIdx}`} 
                            href={src.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold hover:text-corporate dark:hover:text-gold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg transition-all max-w-full truncate font-mono font-bold focus:outline-none"
                            title={src.title}
                          >
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* File Attachment Preview Bar */}
        {imagePreview && (
          <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={imagePreview} 
                alt="Attachment preview" 
                className="w-10 h-10 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                  {attachedImage?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Ready to attach & explain
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                setAttachedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
              title="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex justify-between items-center shrink-0 animate-fade-in">
            <span role="alert" className="font-bold">{errorMsg}</span>
            <button 
              onClick={() => setErrorMsg(null)} 
              className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input box section */}
        <div className="p-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-darkBg shrink-0">
          <div className="flex gap-3 items-center">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 text-slate-400 hover:text-corporate dark:text-slate-400 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Attach invoice, notice, ROC filing document, or receipt (PNG, JPG, WEBP)"
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything about tax, audit procedures, ROC filings, or MCA checklists..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-corporate dark:focus:border-gold text-navy dark:text-white placeholder-slate-400 font-medium disabled:opacity-75"
            />
            
            <button 
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !attachedImage) || isLoading}
              className="bg-navy hover:bg-corporate dark:bg-gold dark:hover:bg-white dark:hover:text-navy text-white p-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md"
              aria-label="Send query"
            >
              <Send size={18} />
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold select-none">
            <Shield size={10} className="text-emerald-500" />
            <span>Privacy-First Architecture: Documents and images are evaluated completely locally in your browser.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
