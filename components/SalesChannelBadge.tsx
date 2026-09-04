'use client';

import React from 'react';
import { SalesChannel } from '@/types';
import {
  Store,
  ShoppingBag,
  ShoppingCart,
  Video,
  UtensilsCrossed,
  Bike,
  Flame,
  Globe,
} from 'lucide-react';

interface SalesChannelBadgeProps {
  channel?: SalesChannel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const getChannelConfig = (channel: SalesChannel = 'Offline / Kasir') => {
  switch (channel) {
    case 'Offline / Kasir':
      return {
        label: 'Kasir Offline',
        icon: Store,
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        tagBg: 'bg-slate-100',
        dotColor: '#64748b',
      };
    case 'Shopee':
      return {
        label: 'Shopee',
        icon: ShoppingBag,
        colorClass: 'bg-orange-50 text-orange-600 border-orange-200',
        tagBg: 'bg-orange-50',
        dotColor: '#ea580c',
      };
    case 'Tokopedia':
      return {
        label: 'Tokopedia',
        icon: ShoppingCart,
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        tagBg: 'bg-emerald-50',
        dotColor: '#059669',
      };
    case 'TikTok Shop':
      return {
        label: 'TikTok Shop',
        icon: Video,
        colorClass: 'bg-sky-50 text-sky-800 border-sky-200',
        tagBg: 'bg-sky-50',
        dotColor: '#0284c7',
      };
    case 'GoFood':
      return {
        label: 'GoFood',
        icon: UtensilsCrossed,
        colorClass: 'bg-red-50 text-red-600 border-red-200',
        tagBg: 'bg-red-50',
        dotColor: '#dc2626',
      };
    case 'GrabFood':
      return {
        label: 'GrabFood',
        icon: Bike,
        colorClass: 'bg-green-50 text-green-700 border-green-200',
        tagBg: 'bg-green-50',
        dotColor: '#16a34a',
      };
    case 'ShopeeFood':
      return {
        label: 'ShopeeFood',
        icon: Flame,
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        tagBg: 'bg-amber-50',
        dotColor: '#d97706',
      };
    case 'Other':
    default:
      return {
        label: channel || 'Lainnya',
        icon: Globe,
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        tagBg: 'bg-slate-100',
        dotColor: '#64748b',
      };
  }
};

export const SalesChannelBadge: React.FC<SalesChannelBadgeProps> = ({
  channel = 'Offline / Kasir',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = getChannelConfig(channel);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  return (
    <span
      id={`badge-channel-${channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`inline-flex items-center font-medium rounded-md border tracking-wide whitespace-nowrap ${config.colorClass} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
