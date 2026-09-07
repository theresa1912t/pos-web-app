import React, { ReactNode } from 'react';

export interface MetricCardProps {
  id?: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  label,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-slate-100 text-slate-700',
  badge,
  className = '',
}) => {
  const badgeClasses: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-700 border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      id={id}
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">{value}</span>
          {badge && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                badgeClasses[badge.variant || 'info']
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};
