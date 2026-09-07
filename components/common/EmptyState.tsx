import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  id?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    id?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-2xl ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          id={action.id}
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
