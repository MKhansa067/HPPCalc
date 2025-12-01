import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
  };

  const trendIcon = trend === 'up' 
    ? <TrendingUp className="w-4 h-4" /> 
    : trend === 'down' 
    ? <TrendingDown className="w-4 h-4" /> 
    : <Minus className="w-4 h-4" />;

  const trendColor = trend === 'up' 
    ? 'text-success' 
    : trend === 'down' 
    ? 'text-destructive' 
    : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'stat-card',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'metric-label mb-2',
            variant === 'primary' && 'text-primary-foreground/70'
          )}>
            {title}
          </p>
          <p className={cn(
            'metric-value',
            variant === 'primary' && 'text-primary-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm mt-1',
              variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
              {trendIcon}
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            variant === 'primary' ? 'bg-primary-foreground/10' : 'bg-muted'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
