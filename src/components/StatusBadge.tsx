import React from 'react';

interface Props {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const s = status.toUpperCase();

  let dotColor = 'bg-slate-400';
  let badgeClasses = 'bg-slate-50 text-slate-600 border-slate-100';

  if (['CRITICAL', 'ESCALATED', 'EMERGENCY', 'HIGH_RISK', 'FULL'].includes(s)) {
    dotColor = 'bg-rose-600';
    badgeClasses = 'bg-rose-50/80 text-rose-700 border-rose-100';
  } else if (['HIGH', 'CLAIMED', 'BUSY', 'EVACUATION'].includes(s)) {
    dotColor = 'bg-amber-500';
    badgeClasses = 'bg-amber-50/80 text-amber-800 border-amber-100';
  } else if (['OPEN', 'AVAILABLE', 'OPERATIONAL', 'SAFE'].includes(s)) {
    dotColor = 'bg-emerald-500';
    badgeClasses = 'bg-emerald-50/80 text-emerald-800 border-emerald-100';
  } else if (['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'ASSIGNED'].includes(s)) {
    dotColor = 'bg-indigo-600';
    badgeClasses = 'bg-indigo-50/80 text-indigo-700 border-indigo-100';
  } else if (['RESOLVED', 'COMPLETED'].includes(s)) {
    dotColor = 'bg-teal-600';
    badgeClasses = 'bg-teal-50/80 text-teal-800 border-teal-100';
  } else if (['CANCELLED', 'REJECTED', 'OFFLINE'].includes(s)) {
    dotColor = 'bg-slate-400';
    badgeClasses = 'bg-slate-50 text-slate-500 border-slate-100';
  } else if (['DUPLICATE', 'CONFIRMED_DUPLICATE'].includes(s)) {
    dotColor = 'bg-purple-600';
    badgeClasses = 'bg-purple-50/80 text-purple-700 border-purple-100';
  }

  const sizeClass =
    size === 'lg'
      ? 'px-3 py-1 text-xs'
      : size === 'md'
      ? 'px-2.5 py-0.5 text-[11px]'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap tracking-wide uppercase ${badgeClasses} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {s.replace(/_/g, ' ')}
    </span>
  );
};

