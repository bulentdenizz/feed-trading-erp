import React from 'react';
import '../../../styles/theme.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, subtitle }) => {
  return (
    <div className="kpi-card">
      {icon && <div className="kpi-card-icon">{icon}</div>}
      <p className="kpi-card-title">{title}</p>
      <p className="kpi-card-value">{value}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
};

export default KpiCard;