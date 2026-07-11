import React, { useState } from 'react';
import { Mail, MapPin, Linkedin, ArrowRight } from 'lucide-react';
import { Icon3D, Icons3D } from './Icons3D';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    purpose: 'Professional Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    if (!formData.email.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      setValidationError('Please enter your message.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate brief processing time for professional feedback feel
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 850);
  };

  const handleMailTo = () => {
    const subject = encodeURIComponent(`Portfolio Inquiry: ${formData.purpose} (${formData.name})`);
    const body = encodeURIComponent(
      `Hello Ankesh,\n\n${formData.message}\n\nBest regards,\n${formData.name}\n${formData.email}`
    );
    window.location.href = `mailto:ankeshkumar9949@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      purpose: 'Professional Inquiry',
      message: ''
    });
    setIsSubmitted(false);
    setValidationError('');
  };

  return (
    <section id="contact" className="py-20 bg-white dark:bg-darkBg transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="bg-navy dark:bg-darkCard rounded-xl p-8 md:p-16 overflow-hidden relative shadow-2xl">
            {/* Decorative Geometric Pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

            <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="w-full md:w-1/2 text-white">
                    <h2 className="text-gold font-bold uppercase tracking-widest text-sm mb-3">Get in Touch</h2>
                    <h3 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">Let's Discuss Opportunities</h3>
                    <p className="text-slate-300 mb-10 text-lg leading-relaxed">
                        I am open to full-time roles, audit assignments, and compliance projects. Whether you are looking to hire a dedicated finance professional or discuss regulatory challenges, let's start the conversation.
                    </p>
                    
                    <div className="space-y-6">
                        <a href="mailto:ankeshkumar9949@gmail.com" className="flex items-center gap-4 text-slate-300 hover:text-white transition-colors group">
                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center group-hover:bg-corporate dark:group-hover:bg-gold transition-colors text-white">
                                <Mail size={20} />
                            </div>
                            <span className="font-medium">ankeshkumar9949@gmail.com</span>
                        </a>
                        <div className="flex items-center gap-4 text-slate-300">
                             <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white">
                                <MapPin size={20} />
                             </div>
                             <span className="font-medium">Hyderabad, India</span>
                        </div>
                        <a href="https://linkedin.com/in/ankeshkumar9949" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-slate-300 hover:text-white transition-colors group">
                             <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center group-hover:bg-[#0077b5] transition-colors text-white">
                                <Linkedin size={20} />
                             </div>
                             <span className="font-medium">linkedin.com/in/ankeshkumar9949</span>
                        </a>
                    </div>
                </div>

                <div className="w-full md:w-1/2 bg-white dark:bg-darkCard backdrop-blur-sm rounded-lg p-8 shadow-lg min-h-[420px] flex flex-col justify-center">
                    {isSubmitted ? (
                        <div className="text-center py-6 flex flex-col items-center justify-center h-full">
                            <div className="mb-6 flex items-center justify-center">
                                <Icon3D icon={Icons3D.CheckCircle} theme="emerald" size="md" title="Success" />
                            </div>
                            <h4 className="text-xl font-bold text-navy dark:text-white mb-2">Inquiry Prepared!</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                                Thank you, <span className="font-semibold text-navy dark:text-white">{formData.name}</span>! Since this form operates client-side to ensure maximum privacy, your message is fully formatted and ready. Click below to launch your default email app to send it, or copy the details to mail me directly at <span className="font-semibold text-navy dark:text-white">ankeshkumar9949@gmail.com</span>.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button 
                                    onClick={handleMailTo}
                                    type="button"
                                    className="flex-1 bg-corporate dark:bg-gold hover:bg-navy dark:hover:bg-white dark:hover:text-navy text-slate-50 dark:text-navy font-bold py-3.5 px-4 rounded-xl transition-[transform,shadow,background-color] duration-300 ease-[0.16,1,0.3,1] flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                                >
                                    Open Mail App <Mail size={16} />
                                </button>
                                <button 
                                    onClick={handleReset}
                                    type="button"
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-4 rounded-xl transition-[transform,shadow,background-color] duration-300 ease-[0.16,1,0.3,1] flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                                >
                                    Send Another
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                            {validationError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50 rounded text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse" role="alert">
                                    <span>⚠️</span> {validationError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                    <label htmlFor="contact-name" className="block text-xs font-bold text-navy dark:text-slate-300 uppercase mb-2">Name</label>
                                    <input 
                                        type="text" 
                                        id="contact-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        aria-required="true"
                                        autoComplete="name"
                                        className="w-full px-4 py-3 bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:border-corporate dark:focus:border-gold focus:ring-1 outline-none transition-all text-navy dark:text-white placeholder-slate-400" 
                                        placeholder="Full Name" 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-email" className="block text-xs font-bold text-navy dark:text-slate-300 uppercase mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        id="contact-email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        aria-required="true"
                                        autoComplete="email"
                                        className="w-full px-4 py-3 bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:border-corporate dark:focus:border-gold focus:ring-1 outline-none transition-all text-navy dark:text-white placeholder-slate-400" 
                                        placeholder="Email Address" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="contact-purpose" className="block text-xs font-bold text-navy dark:text-slate-300 uppercase mb-2">Purpose</label>
                                <select 
                                    id="contact-purpose"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:border-corporate dark:focus:border-gold focus:ring-1 outline-none transition-all text-slate-600 dark:text-slate-300"
                                >
                                    <option value="Professional Inquiry">Professional Inquiry</option>
                                    <option value="Full-time Opportunity">Full-time Opportunity</option>
                                    <option value="Recruitment">Recruitment</option>
                                    <option value="Collaboration">Collaboration</option>
                                    <option value="Networking">Networking</option>
                                    <option value="General Inquiry">General Inquiry</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="contact-message" className="block text-xs font-bold text-navy dark:text-slate-300 uppercase mb-2">Message</label>
                                <textarea 
                                    id="contact-message"
                                    name="message"
                                    rows={3} 
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    aria-required="true"
                                    className="w-full px-4 py-3 bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:border-corporate dark:focus:border-gold focus:ring-1 outline-none transition-all text-navy dark:text-white placeholder-slate-400" 
                                    placeholder="How can I assist you?"
                                ></textarea>
                            </div>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-corporate dark:bg-gold hover:bg-navy dark:hover:bg-white dark:hover:text-navy text-slate-50 dark:text-slate-900 font-bold py-3.5 rounded-xl transition-[transform,shadow,background-color] duration-300 ease-[0.16,1,0.3,1] flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        Processing...
                                        <svg className="animate-spin h-5 w-5 text-white dark:text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        Send Message <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;