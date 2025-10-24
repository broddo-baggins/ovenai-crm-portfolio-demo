import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

export interface RTLChartProps {
  data: Array<{ label?: string; value?: number; [key: string]: unknown }>;
  type: 'line' | 'bar' | 'pie' | 'area';
  title?: string;
  height?: number;
  className?: string;
}

const RTLChart: React.FC<RTLChartProps> = ({
  data,
  type,
  title,
  height = 300,
  className
}) => {
  const { t } = useTranslation('charts');
  const { isRTL, textStart } = useLang();

  // Mock chart rendering - in a real implementation, you'd use Chart.js, Recharts, etc.
  const renderMockChart = () => {
    return (
      <div 
        className={cn(
          "w-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center",
          isRTL && "font-hebrew"
        )}
        style={{ height }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className={cn("text-center", textStart())}>
          <div className="text-lg font-medium text-gray-700 mb-2">
            {title || t('chart.defaultTitle', 'Chart')}
          </div>
          <div className="text-sm text-gray-500">
            {t('chart.mockData', 'Mock chart data visualization')} ({type})
          </div>
          <div className="mt-4 text-xs text-gray-400">
            {t('chart.rtlSupport', `RTL: ${isRTL ? 'Enabled' : 'Disabled'}`)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn("w-full", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {title && (
        <h3 className={cn(
          "text-lg font-semibold mb-4 text-gray-900",
          textStart(),
          isRTL && "font-hebrew"
        )}>
          {title}
        </h3>
      )}
      
      {renderMockChart()}
      
      {/* Chart Legend for RTL demonstration */}
      <div className={cn(
        "mt-4 flex flex-wrap gap-4",
        isRTL ? "justify-end" : "justify-start"
      )}>
        {data.slice(0, 3).map((item, index) => (
          <div 
            key={index}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `hsl(${index * 120}, 70%, 50%)` }}
            />
            <span className={cn(
              "text-sm text-gray-600",
              textStart(),
              isRTL && "font-hebrew"
            )}>
              {item.label || `${t('chart.series', 'Series')} ${index + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RTLChart; 