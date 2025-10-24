import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, GripVertical, X } from 'lucide-react';
import { WidgetConfig } from '@/types/widgets';

interface DraggableWidgetProps {
  config: WidgetConfig;
  onUpdate: (config: WidgetConfig) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

const DraggableWidget = ({ config, onUpdate, onRemove, children }: DraggableWidgetProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Add state and ref for delayed settings opening
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);
  const settingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SETTINGS_DELAY_MS = 300; // 300ms delay to prevent accidental opening

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Calculate new position based on grid
    const gridSize = 100; // 100px grid
    const newX = Math.round((config.position.x + dx) / gridSize) * gridSize;
    const newY = Math.round((config.position.y + dy) / gridSize) * gridSize;

    onUpdate({
      ...config,
      position: { x: newX, y: newY }
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle settings button mouse interactions with delay
  const handleSettingsMouseEnter = () => {
    setIsSettingsHovered(true);
    // Clear any existing timeout
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }
    // Set a delay before opening settings
    settingsTimeoutRef.current = setTimeout(() => {
      if (isSettingsHovered) {
        setShowSettings(true);
      }
    }, SETTINGS_DELAY_MS);
  };

  const handleSettingsMouseLeave = () => {
    setIsSettingsHovered(false);
    // Clear the timeout to prevent opening
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
      settingsTimeoutRef.current = null;
    }
  };

  const handleSettingsClick = () => {
    // For click events, open immediately
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
      settingsTimeoutRef.current = null;
    }
    setShowSettings(true);
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        position: 'absolute',
        left: config.position.x,
        top: config.position.y,
        width: config.size.width,
        height: config.size.height,
        zIndex: isDragging ? 50 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{config.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`transition-all duration-200 ${
                isSettingsHovered ? 'bg-gray-100 scale-105' : ''
              }`}
              title={isSettingsHovered ? "Opening settings..." : "Widget settings (hover to open)"}
              onMouseEnter={handleSettingsMouseEnter}
              onMouseLeave={handleSettingsMouseLeave}
              onClick={handleSettingsClick}
            >
              <Settings className={`h-4 w-4 transition-all duration-200 ${
                isSettingsHovered ? 'animate-pulse' : ''
              }`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(config.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>

      {showSettings && (
        <div className="absolute top-0 left-0 z-50">
          <div className="bg-white p-4 rounded shadow-lg border">
            <p className="text-sm text-gray-600">Settings panel would open here</p>
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableWidget; 