import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'auto';

interface DurumBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<Exclude<BadgeVariant, 'auto'>, string> = {
  success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  muted: "bg-muted text-muted-foreground",
};

function getAutoVariant(status: string): Exclude<BadgeVariant, 'auto'> {
  const s = status.toLowerCase();
  
  if (s === 'ödendi' || s === 'aktif' || s === 'normal') return 'success';
  if (s === 'bekliyor' || s === 'kısmi' || s === 'kritik') return 'warning';
  if (s === 'gecikmiş' || s === 'tükendi' || s === 'i̇ptal' || s === 'iptal' || s === 'pasif') return 'danger';
  if (s === 'vadeli') return 'info';
  
  return 'muted';
}

const DurumBadge: React.FC<DurumBadgeProps> = ({ status, variant = 'auto', className = '' }) => {
  const activeVariant = variant === 'auto' ? getAutoVariant(status) : variant;
  const styleClass = variantStyles[activeVariant];

  return (
    <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-md ${styleClass} ${className}`}>
      {status}
    </span>
  );
};

export default DurumBadge;