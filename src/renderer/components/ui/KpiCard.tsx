import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'green' | 'amber' | 'red' | 'blue' | 'muted';
}

const badgeVariants = {
  green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  muted: "bg-muted text-muted-foreground",
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, badge, badgeVariant = 'muted' }) => {
  const badgeClass = `text-xs px-1.5 py-0.5 rounded-md ${badgeVariants[badgeVariant]}`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl" style={{ fontWeight: 700 }}>{value}</span>
        {badge && <span className={badgeClass}>{badge}</span>}
      </div>
    </div>
  );
};

export default KpiCard;