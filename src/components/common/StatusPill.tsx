import React from 'react';
import { ShipmentStatus } from '../../types';
import { getShipmentStatusBadge } from '../../utils/formatters';

interface StatusPillProps {
  status: ShipmentStatus | string;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'sm', pulse = false }) => {
  const badge = getShipmentStatusBadge(status as ShipmentStatus);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wider uppercase border ${badge.bg} ${badge.text} ${badge.border} ${sizeClasses}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {badge.label}
    </span>
  );
};
