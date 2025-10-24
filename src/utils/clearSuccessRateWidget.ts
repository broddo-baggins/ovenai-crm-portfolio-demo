import logger from '@/services/base/logger';

/**
 * @deprecated This utility is for one-time migration/cleanup and should be removed after use
 * 
 * TODO: Remove this file after confirming all users have migrated from Success Rate widget
 * This appears to be cleanup code for a specific widget removal
 */

// Utility to clean up Success Rate widget from saved layouts
export const cleanupSuccessRateWidget = () => {
  try {
    const saved = localStorage.getItem('dashboard-layout');
    if (saved) {
      const savedData = JSON.parse(saved);
      const savedWidgets = savedData.widgets || savedData;
      
      // Filter out the success-rate-default widget
      const cleanedWidgets = savedWidgets.filter((widget: any) => 
        widget.id !== 'success-rate-default'
      );
      
      // Update positions for remaining widgets to fill the gap
      const updatedWidgets = cleanedWidgets.map((widget: any) => {
        // If conversations-completed was at x: 9, move it to x: 6
        if (widget.id === 'conversations-completed-default' && widget.gridLayout?.x === 9) {
          return {
            ...widget,
            gridLayout: {
              ...widget.gridLayout,
              x: 6
            },
            position: {
              ...widget.position,
              x: 640
            }
          };
        }
        return widget;
      });
      
      // Save the cleaned layout
      const cleanedData = {
        ...savedData,
        widgets: updatedWidgets,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('dashboard-layout', JSON.stringify(cleanedData));
      logger.info('Success Rate widget removed from saved layout', 'WidgetCleanup');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error cleaning up Success Rate widget', 'WidgetCleanup', error);
    return false;
  }
}; 