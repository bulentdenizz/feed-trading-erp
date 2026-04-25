import React from 'react';
import '../../styles/theme.css';

interface DurumBadgeProps {
  status: string;
  variant?: 'default' | 'primary' | 'destructive' | 'success' | 'warning' | 'info';
}

const DurumBadge: React.FC<DurumBadgeProps> = ({ status, variant = 'default' }) => {
  const badgeClass = variant === 'default' ? 'badge' : `badge badge-${variant}`;

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
};

export default DurumBadge;