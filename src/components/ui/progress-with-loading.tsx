import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';

interface ProgressWithLoadingProps {
  value?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
  label?: string;
  description?: string;
}

export const ProgressWithLoading: React.FC<ProgressWithLoadingProps> = ({
  value = 0,
  className,
  size = 'md',
  variant = 'default',
  showPercentage = false,
  animated = false,
  indeterminate = false,
  label,
  description,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth animation effect
  useEffect(() => {
    if (!indeterminate && animated) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated, indeterminate]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-6';
      default:
        return 'h-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return '[&>*]:bg-green-500';
      case 'warning':
        return '[&>*]:bg-orange-500';
      case 'error':
        return '[&>*]:bg-red-500';
      default:
        return '[&>*]:bg-primary';
    }
  };

  const progressClasses = cn(
    getSizeClasses(),
    getVariantClasses(),
    indeterminate && 'animate-pulse',
    className
  );

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm text-muted-foreground">
              {Math.round(displayValue)}%
            </span>
          )}
        </div>
      )}
      
      <Progress
        value={indeterminate ? undefined : displayValue}
        className={progressClasses}
      />
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};

// Loading spinner progress for indeterminate states
export const LoadingProgress: React.FC<{
  label?: string;
  description?: string;
  className?: string;
}> = ({ label, description, className }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 0;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <ProgressWithLoading
      value={progress}
      label={label}
      description={description}
      className={className}
      animated
      showPercentage
    />
  );
};

// Specific loading states for common operations
export const DataLoadingProgress: React.FC<{
  stage: 'connecting' | 'fetching' | 'processing' | 'complete';
  progress?: number;
}> = ({ stage, progress }) => {
  const { t } = useTranslation('common');
  const { isRTL, textStart } = useLang();

  const stageLabels = {
    connecting: t('loading.connecting', 'Connecting to database...'),
    fetching: t('loading.fetching', 'Fetching data...'),
    processing: t('loading.processing', 'Processing results...'),
    complete: t('loading.complete', 'Complete!')
  };

  const stageProgress = {
    connecting: progress || 25,
    fetching: progress || 50,
    processing: progress || 75,
    complete: 100
  };

  return (
    <div className={cn(isRTL && "font-hebrew")} dir={isRTL ? "rtl" : "ltr"}>
      <ProgressWithLoading
        value={stageProgress[stage]}
        label={stageLabels[stage]}
        variant={stage === 'complete' ? 'success' : 'default'}
        animated
        showPercentage
        className={textStart()}
      />
    </div>
  );
};

export default ProgressWithLoading; 