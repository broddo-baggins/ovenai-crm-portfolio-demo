import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import ResponsiveDashboard from './ResponsiveDashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button"; // Unused import
import { Smartphone, Monitor, Tablet } from 'lucide-react';

/**
 * SpringboardDemo Component
 * 
 * Demonstrates the responsive dashboard that switches between:
 * - Desktop: Multi-column grid layout (NewGridDashboard)
 * - Mobile: Single-column Springboard layout (SpringboardDashboard)
 * 
 * Features:
 * - Automatic responsive switching at 768px breakpoint
 * - iOS Springboard-like mobile experience
 * - Full integration with existing DashboardContext
 * - Smooth transitions between layouts
 */
const SpringboardDemo: React.FC = () => {
  const {
    widgets,
    updateWidget,
    removeWidget,
    organizeWidgets,
    addWidget,
    hasUnsavedChanges,
  } = useDashboard();

  return (
    <div className="w-full h-full">
      {/* Info Card - Only visible on desktop */}
      <div className="hidden md:block mb-6 max-w-4xl mx-auto px-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Smartphone className="h-5 w-5" />
              Responsive Dashboard Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                                     <h4 className="font-semibold text-blue-800">Desktop (&gt;768px)</h4>
                  <p className="text-blue-700">Multi-column grid with drag & drop</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tablet className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800">Tablet (≤768px)</h4>
                  <p className="text-blue-700">iOS Springboard single-column</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800">Mobile (≤480px)</h4>
                  <p className="text-blue-700">Full-width tiles, thumb-friendly</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200">
              <p className="text-blue-700 text-xs">
                IDEA <strong>Try it:</strong> Resize your browser window or open on a mobile device to see the automatic layout switch
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

             {/* Responsive Dashboard */}
       <ResponsiveDashboard
         widgets={widgets}
         onUpdateWidget={updateWidget}
         onRemoveWidget={removeWidget}
         onOrganizeWidgets={organizeWidgets}
         onAddWidget={() => addWidget('total-chats')} // Default widget type for demo
         hasUnsavedChangesFromContext={hasUnsavedChanges}
       />
    </div>
  );
};

export default SpringboardDemo; 