import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const WorkspaceNotifications: React.FC = () => {
  const { notifications, dismissNotification } = useWorkspace();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      default:
        return <Info size={16} className="text-sky-500 shrink-0" />;
    }
  };

  const getBgStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200';
      case 'error':
        return 'bg-rose-50/95 dark:bg-rose-950/20 border-rose-500/30 text-rose-800 dark:text-rose-200';
      case 'warning':
        return 'bg-amber-50/95 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-200';
      default:
        return 'bg-sky-50/95 dark:bg-sky-950/20 border-sky-500/30 text-sky-800 dark:text-sky-250';
    }
  };

  return (
    <div 
      id="workspace-notifications-stack"
      className="fixed bottom-12 right-4 z-[125] flex flex-col gap-2.5 max-w-sm w-full px-4 select-none pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ opacity: 0, y: 15, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-lg pointer-events-auto transition-colors duration-300 ${getBgStyle(notif.type)}`}
          >
            {getIcon(notif.type)}
            
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold leading-normal tracking-tight break-words">
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => dismissNotification(notif.id)}
              className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
              title="Dismiss notification"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
