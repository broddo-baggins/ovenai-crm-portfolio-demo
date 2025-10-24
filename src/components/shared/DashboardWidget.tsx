import React, { ReactNode } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/**
 * Props for trend indicator
 */
interface TrendData {
  value: string | number;
  positive: boolean;
  label?: string;
}

/**
 * Props for bottom statistics
 */
interface StatItem {
  label: string;
  value: string | number;
  highlighted?: boolean;
  color?: string;
}

/**
 * Props for the DashboardWidget component
 */
interface DashboardWidgetProps {
  title: string;
  titleKey?: string;
  subtitle: string;
  subtitleKey?: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  trend?: TrendData;
  badge?: {
    value: string | number;
    color?: string;
  };
  stats?: StatItem[];
  locale?: string;
  namespace?: string;
  className?: string;
}

/**
 * Consolidated DashboardWidget Component
 * 
 * Replaces duplicate widget patterns like TotalLeads, ReachedLeads, etc.
 * Provides consistent RTL support, internationalization, and styling
 */
const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  value,
  icon,
  iconColor = "text-blue-600",
  trend,
  badge,
  stats = [],
  locale,
  namespace = 'widgets',
  className = ""
}) => {
  const { t } = useTranslation(namespace);
  const { isRTL, flexRowReverse, textStart, textEnd } = useLang();
  
  // Use provided locale or determine from RTL setting
  const numberLocale = locale || (isRTL ? 'he-IL' : 'en-US');
  
  // Format numbers consistently
  const formatNumber = (num: string | number): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return numValue.toLocaleString(numberLocale);
  };

  return (
    <div className={cn("h-full p-4 flex flex-col", isRTL && "font-hebrew", className)} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with title, icon, and optional badge */}
      <div className={cn("flex items-center justify-between mb-4", flexRowReverse())}>
        <div className={cn("flex items-center space-x-2", flexRowReverse())}>
          <div className={cn("h-5 w-5", iconColor)}>
            {icon}
          </div>
          <h3 className={cn("text-sm font-medium text-gray-700", textStart())}>
            {titleKey ? t(titleKey, title) : title}
          </h3>
        </div>
        {badge && (
          <div className={cn(
            `text-xs px-2 py-1 rounded-full font-medium ${
              badge.color || 'bg-blue-100 text-blue-600'
            }`, 
            textEnd()
          )}>
            {badge.value}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center">
          {/* Main value */}
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatNumber(value)}
          </div>
          
          {/* Subtitle */}
          <div className={cn("text-sm text-gray-500 mb-2", textStart())}>
            {subtitleKey ? t(subtitleKey, subtitle) : subtitle}
          </div>
          
          {/* Trend indicator */}
          {trend && (
            <div className={cn(`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
              trend.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`, flexRowReverse())}>
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3 rotate-180" />
              )}
              <span>
                {trend.value} {trend.label || (trend.positive ? 'Increase' : 'Decrease')}
              </span>
            </div>
          )}
        </div>

        {/* Bottom statistics */}
        {stats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {stats.map((stat, index) => (
              <div key={index} className={cn("flex justify-between text-xs text-gray-500 mt-1", flexRowReverse())}>
                <span className={textStart()}>{stat.label}</span>
                <span className={cn(
                  stat.highlighted ? "font-medium text-gray-700" : "",
                  stat.color || "",
                  textEnd()
                )}>
                  {formatNumber(stat.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidget; 