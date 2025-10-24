import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  variant?: 'default' | 'card' | 'table' | 'dashboard';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className,
  variant = 'default'
}) => {
  const renderDefault = () => (
    <div className={cn("space-y-3", className)}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const renderCard = () => (
    <div className={cn("animate-pulse", className)}>
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className={cn("animate-pulse", className)}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="animate-pulse">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table */}
      <div className="animate-pulse">
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  switch (variant) {
    case 'card':
      return renderCard();
    case 'table':
      return renderTable();
    case 'dashboard':
      return renderDashboard();
    default:
      return renderDefault();
  }
};

// Specific skeleton components for common use cases
export const DashboardSkeleton = () => <LoadingSkeleton variant="dashboard" />;
export const TableSkeleton = () => <LoadingSkeleton variant="table" />;
export const CardSkeleton = () => <LoadingSkeleton variant="card" />;

// RTL-aware skeleton
export const RTLLoadingSkeleton: React.FC<LoadingSkeletonProps> = (props) => {
  return (
    <div className="rtl:text-right rtl:space-x-reverse">
      <LoadingSkeleton {...props} />
    </div>
  );
}; 