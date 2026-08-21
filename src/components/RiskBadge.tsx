import React from 'react';
import { RiskLevel } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md'
}) => {
  let badgeStyle = 'bg-green-100 text-green-700 border-green-200';
  let icon = <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />;
  let label = 'Rendah';

  if (level === 'HIGH') {
    badgeStyle = 'bg-red-100 text-red-700 border-red-200';
    icon = <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />;
    label = 'Tinggi';
  } else if (level === 'MEDIUM') {
    badgeStyle = 'bg-orange-100 text-orange-700 border-orange-200';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
    label = 'Sedang';
  }

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-bold rounded'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-extrabold rounded-md'
      : 'px-2.5 py-1 text-xs font-bold rounded';

  return (
    <span
      id={`risk-badge-${level.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 border ${badgeStyle} ${sizeClass} transition-colors whitespace-nowrap shadow-2xs`}
    >
      {showIcon && icon}
      <span>{score !== undefined ? `${(score / 10).toFixed(1)} - ${label}` : label}</span>
    </span>
  );
};
