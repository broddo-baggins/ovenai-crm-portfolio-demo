import React, { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/widgets';
import NewGridDashboard from './NewGridDashboard';
import SpringboardDashboard from './SpringboardDashboard';

interface ResponsiveDashboardProps {
  widgets: WidgetConfig[];
  onUpdateWidget: (config: WidgetConfig) => void;
  onRemoveWidget: (id: string) => void;
  onOrganizeWidgets?: () => void;
  onAddWidget: () => void;
  hasUnsavedChangesFromContext: boolean;
}

const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = (props) => {
  const [_isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      // Switch to mobile layout at 768px and below
      setIsMobile(width <= 768);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force mobile layout for optimal experience
  // You can change this threshold based on your preferences
  const shouldUseMobile = windowWidth <= 768;

  if (shouldUseMobile) {
    return <SpringboardDashboard {...props} />;
  }

  return <NewGridDashboard {...props} />;
};

export default ResponsiveDashboard; 