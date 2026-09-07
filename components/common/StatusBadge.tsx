import React from 'react';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

export interface StatusBadgeProps {
  id?: string;
  label: string;
  variant?: StatusBadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  id,
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses: Record<StatusBadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    info: {
      container: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
    },
    purple: {
      container: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const currentVariant = variantClasses[variant] || variantClasses.neutral;

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${currentVariant.container} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentVariant.dot}`} />}
      <span>{label}</span>
    </span>
  );
};
