import React from 'react';

interface ActionToolbarProps {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  className?: string;
}

export default function ActionToolbar({
  leftSection,
  rightSection,
  className = ""
}: ActionToolbarProps) {
  return (
    <div className={`bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-800/60 rounded-2xl ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {leftSection && (
          <div className="space-y-1.5 flex-1">
            {leftSection}
          </div>
        )}
        {rightSection && (
          <div className="space-y-1.5 shrink-0">
            {rightSection}
          </div>
        )}
      </div>
    </div>
  );
}
