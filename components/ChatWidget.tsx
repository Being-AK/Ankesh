import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, X, Send, Shield, Globe, Paperclip, Minimize2 } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

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

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome-message',
      role: 'model', 
      text: "👋 Hello! I am **Ankesh AI**, your dedicated tax & regulatory assistant. How can I help you today with GST, Auditing, Income Tax, or Company Law?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Smart compact launcher states
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic positioning state to avoid overlapping fixed headers or Resume buttons
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    bottom: '80px',
    right: '24px',
    width: '380px',
    height: '520px',
    maxHeight: 'calc(100vh - 120px)',
    zIndex: 45,
  });

  const recalculatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;

      const headerEl = document.querySelector('header') as HTMLElement | null;
      const headerHeight = headerEl ? headerEl.offsetHeight : (isMobile ? 64 : 80);

      const topClearance = isMobile ? 16 : 24;
      const rightClearance = isMobile ? 16 : 24;

      // Deterministic, 100% reliable calculation of launcher bottom spacing
      const launcherAreaHeight = isMobile ? 80 : 96;

      let shiftLeft = 0;

      // Safe, performant selector to find potential overlapping elements on the right/bottom
      const candidateElements = Array.from(
        document.querySelectorAll('a, button, [role="button"], [class*="resume"], [id*="resume"]')
      );

      const chatWidth = isMobile ? vw - 32 : 380;
      const defaultChatRight = rightClearance;
      const defaultChatLeft = vw - (defaultChatRight + chatWidth);
      const defaultChatBottom = vh - launcherAreaHeight;
      const maxAvailableHeight = vh - headerHeight - topClearance - launcherAreaHeight - (isMobile ? 12 : 20);
      const finalHeight = Math.max(280, Math.min(520, maxAvailableHeight));
      const defaultChatTop = defaultChatBottom - finalHeight;

      candidateElements.forEach((el) => {
        try {
          if (!el) return;
          // Ignore elements within the chat dialog or the chat toggle launcher itself
          if (
            el.closest('[role="dialog"]') || 
            el.id === 'chat-launcher-btn' || 
            el.closest('#chat-widget-container')
          ) {
            return;
          }

          const style = window.getComputedStyle(el);
          if (!style) return;

          const isFixedOrAbsolute = style.position === 'fixed' || style.position === 'absolute';
          if (!isFixedOrAbsolute) return;

          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          // Detect if this is a Resume element or other floating element
          const textContent = (el.textContent || '').toLowerCase();
          const isResume = 
            textContent.includes('resume') ||
            (el.getAttribute('download') || '').toLowerCase().includes('resume') ||
            (el.getAttribute('aria-label') || '').toLowerCase().includes('resume') ||
            (el.getAttribute('href') || '').toLowerCase().includes('resume') ||
            (el.className || '').toLowerCase().includes('resume');

          // Check for bottom-right elements that are likely floating or fixed in the same zone
          const isBottomRightFloat = rect.bottom > vh - 220 && rect.right > vw - 220;

          if (isResume || isBottomRightFloat) {
            const overlapsX = rect.left < vw - defaultChatRight && rect.right > defaultChatLeft;
            const overlapsY = rect.top < defaultChatBottom && rect.bottom > defaultChatTop;

            if (overlapsX && overlapsY) {
              const neededRight = (vw - rect.left) + 24; // element right bound plus 24px gap for clean visual breathing room
              shiftLeft = Math.max(shiftLeft, neededRight - rightClearance);
            }
          }
        } catch (e) {
          // Ignore styled element errors
        }
      });

      const style: React.CSSProperties = {
        position: 'fixed',
        bottom: `${launcherAreaHeight}px`,
        height: `${finalHeight}px`,
        maxHeight: `${maxAvailableHeight}px`,
        zIndex: 45,
      };

      if (isMobile) {
        style.right = '16px';
        style.width = 'calc(100vw - 32px)';
      } else {
        style.right = `${rightClearance + shiftLeft}px`;
        style.width = '380px';
      }

      setPositionStyle(style);
    } catch (err) {
      console.error("Error calculating position:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      recalculatePosition();
      window.addEventListener('resize', recalculatePosition);
      window.addEventListener('scroll', recalculatePosition);
      
      const timer = setTimeout(recalculatePosition, 200);
      return () => {
        window.removeEventListener('resize', recalculatePosition);
        window.removeEventListener('scroll', recalculatePosition);
        clearTimeout(timer);
      };
    }
  }, [isOpen, recalculatePosition]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef(false);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Show expanded launcher briefly on first visit in the session
    const hasVisitedSession = sessionStorage.getItem('ankesh_ai_visited');
    if (!hasVisitedSession) {
      setIsIntroActive(true);
      const timer = setTimeout(() => {
        setIsIntroActive(false);
        sessionStorage.setItem('ankesh_ai_visited', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const triggerError = useCallback((msg: string) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setErrorMsg(msg);
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
    if (!isOpen) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isTyping && lastMessage.role === 'model') {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    const event = new CustomEvent('chat-widget-state', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  useEffect(() => {
    const isVisible = !isOpen && (isIntroActive || isHovered);
    const event = new CustomEvent('chat-label-state', { detail: { isVisible } });
    window.dispatchEvent(event);
  }, [isOpen, isIntroActive, isHovered]);

  // Escape key support to close chat
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDownGlobal);
    return () => document.removeEventListener('keydown', handleKeyDownGlobal);
  }, [isOpen]);

  // Focus message input automatically when chat opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
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

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedImage) || isLoading || isGeneratingRef.current) return;

    const userText = inputValue.trim();
    const currentPreview = imagePreview;
    const currentImageFile = attachedImage;
    
    setInputValue('');
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
        text: userText || "Analyzed attached document", 
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
        userText || "Please analyze this compliance document, invoice, notice, or financial statement.", 
        history, 
        imageParam
      );

      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isTyping) {
          newMessages[newMessages.length - 1] = {
            id: newMessages[newMessages.length - 1].id,
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
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isTyping) {
          newMessages[newMessages.length - 1] = {
            id: newMessages[newMessages.length - 1].id,
            role: 'model',
            text: "I apologize, but an unexpected system error occurred. Please try sending your inquiry again."
          };
        } else {
          newMessages.push({
            id: generateId(),
            role: 'model',
            text: "I apologize, but an unexpected system error occurred. Please try sending your inquiry again."
          });
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

  const handleSuggestedQuery = (queryText: string) => {
    setInputValue(queryText);
    inputRef.current?.focus();
  };

  return (
    <div id="chat-widget-container" className="font-sans select-none">
      {/* Chat Window */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Ankesh AI Chat Window"
          style={positionStyle}
          className="bg-white dark:bg-darkCard rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] flex flex-col border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-colors animate-fade-in select-text"
        >
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 py-3 px-4 flex justify-between items-center border-b border-slate-800/80 shrink-0 select-none">
            <div className="flex items-center gap-2.5 text-slate-100 min-w-0">
              <div className="bg-gold/10 p-1.5 rounded-lg border border-gold/20 shrink-0 flex items-center justify-center">
                <Shield size={16} className="text-gold" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-sm tracking-wide text-white font-sans leading-none truncate">Ankesh AI</h3>
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none flex items-center justify-center"
                aria-label="Minimize chat window"
              >
                <Minimize2 size={16} aria-hidden="true" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none flex items-center justify-center"
                aria-label="Close chat window"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            role="log"
            aria-live="polite"
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/40 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          >
            {messages.map((msg) => {
              if (msg.isTyping) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-corporate dark:bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="sr-only">Ankesh AI is composing a response...</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-indigo-600 to-corporate dark:from-gold dark:to-amber-400 text-white dark:text-slate-950 font-medium rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.image && (
                      <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-white/20 dark:border-slate-700">
                        <img 
                          src={msg.image} 
                          alt="Uploaded document preview" 
                          className="max-h-48 object-contain w-full rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {msg.role === 'model' ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-800 dark:text-slate-200">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-800 dark:text-slate-200">{children}</ol>,
                            li: ({ children }) => <li className="pl-0.5 leading-relaxed text-slate-800 dark:text-slate-200">{children}</li>,
                            strong: ({ children }) => <strong className="font-extrabold text-slate-950 dark:text-white">{children}</strong>,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-corporate dark:text-gold hover:underline font-semibold break-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none rounded"
                              >
                                {children}
                              </a>
                            ),
                            code: ({ children }) => (
                              <code className="bg-slate-100 dark:bg-slate-900 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded font-mono text-xs">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                          <Globe size={10} className="text-slate-400 dark:text-gold" aria-hidden="true" /> Checked Sources:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src) => {
                            let label = src.title;
                            try {
                              const urlObj = new URL(src.uri);
                              label = urlObj.hostname.replace('www.', '');
                            } catch (e) {}

                            return (
                              <a 
                                key={`${msg.id}-src-${src.uri}`} 
                                href={src.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold hover:text-corporate dark:hover:text-gold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded transition-all max-w-full truncate font-mono focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                                title={src.title}
                              >
                                <span className="truncate">{label}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {messages.length === 1 && (
              <div className="space-y-2.5 px-1 pt-2">
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Suggested Queries:</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleSuggestedQuery("What are the key compliance deadlines for an Indian Private Limited Company?")}
                    className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none hover:-translate-y-0.5 duration-200"
                    aria-label="Ask suggested query: What are the key compliance deadlines for an Indian Private Limited Company?"
                  >
                    🏢 Pvt Ltd Filing Deadlines?
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuery("Can you describe Ankesh's expertise and audit portfolio?")}
                    className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none hover:-translate-y-0.5 duration-200"
                    aria-label="Ask suggested query: Can you describe Ankesh's expertise and audit portfolio?"
                  >
                    💼 Learn about Ankesh's audit background
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuery("Analyze this invoice image for GST and compliance accuracy.")}
                    className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none hover:-translate-y-0.5 duration-200"
                    aria-label="Ask suggested query: Analyze document image compliance"
                  >
                    📄 Analyze document image compliance
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attached Image Preview Strip */}
          {imagePreview && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={imagePreview} 
                  alt="Attachment preview" 
                  className="w-8 h-8 object-cover rounded border border-slate-300 dark:border-slate-600"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[11px] text-slate-550 dark:text-slate-400 truncate max-w-[180px]">
                  {attachedImage?.name}
                </span>
              </div>
              <button 
                onClick={() => {
                  setAttachedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                title="Remove image attachment"
                aria-label="Remove image attachment"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Inline Error Message Banner */}
          {errorMsg && (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-100 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 text-xs flex justify-between items-center shrink-0">
              <span role="alert" className="font-medium leading-normal">{errorMsg}</span>
              <button 
                onClick={() => setErrorMsg(null)} 
                className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none p-0.5 rounded"
                aria-label="Dismiss error notification"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Input Box Area */}
          <div className="p-4 bg-white dark:bg-darkCard border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex gap-2 items-center">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                id="chat-file-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-corporate dark:text-slate-400 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                title="Upload invoice, tax notice, balance sheet, or other business documents for secure local explanation and analysis"
                aria-label="Upload document image"
              >
                <Paperclip size={18} aria-hidden="true" />
              </button>

              <input
                type="text"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask compliance or portfolio query..."
                className="flex-1 bg-light dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-corporate dark:focus:border-gold focus:ring-1 text-navy dark:text-white placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                aria-label="Chat input query"
              />
              <button 
                onClick={handleSend}
                disabled={(!inputValue.trim() && !attachedImage) || isLoading}
                className="bg-navy hover:bg-corporate dark:bg-gold dark:hover:bg-white dark:hover:text-navy text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                aria-label="Send query"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-center select-none font-medium">
              🔒 Privacy-First: Secure local-bound analysis & validation.
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button with Helper Bubble */}
      <div 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2"
        onMouseEnter={() => { if (!isOpen) setIsHovered(true); }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isOpen && (isIntroActive || isHovered) && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 select-none pointer-events-none transition-all duration-300 transform translate-x-0 animate-fade-in max-w-[200px] shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">Ankesh AI</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">Compliance Assistant</span>
            </div>
          </div>
        )}
        <button
          id="chat-launcher-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Ankesh AI chat window" : "Open Ankesh AI chat window"}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="group relative flex items-center justify-center w-12 h-12 bg-navy dark:bg-gold hover:bg-corporate dark:hover:bg-white dark:hover:text-navy text-white dark:text-navy rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-slate-200 dark:border-slate-800 shrink-0 focus-visible:ring-4 focus-visible:ring-gold focus-visible:outline-none"
        >
          {isOpen ? <X size={20} aria-hidden="true" /> : <MessageSquare size={20} aria-hidden="true" />}
          {!isOpen && (
               <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
