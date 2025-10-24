import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ArrowRight, 
  ArrowDown, 
  Minimize2,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TouchingPair, OverlapAnalysis } from '@/utils/collisionDetector';

interface CollisionSuggestionProps {
  analysis: OverlapAnalysis;
  onAcceptSeparation: (pair: TouchingPair) => void;
  onSeparateAll: () => void;
  onDismiss: () => void;
  isVisible: boolean;
  compact?: boolean;
}

const CollisionSuggestion: React.FC<CollisionSuggestionProps> = ({
  analysis,
  onAcceptSeparation,
  onSeparateAll,
  onDismiss,
  isVisible,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissedPermanently, setIsDismissedPermanently] = useState(false);
  
  const { overlappingPairs, touchingPairs, totalIssues, recommendation } = analysis;

  // Check localStorage on mount and listen for toggle events
  useEffect(() => {
    const dismissed = localStorage.getItem('collision-suggestion-dismissed');
    if (dismissed === 'true') {
      setIsDismissedPermanently(true);
    }

    // Listen for widget spacing toggle event from dashboard bar
    const handleWidgetSpacingToggle = () => {
      setIsDismissedPermanently(false);
    };

    window.addEventListener('widget-spacing-toggle', handleWidgetSpacingToggle);

    return () => {
      window.removeEventListener('widget-spacing-toggle', handleWidgetSpacingToggle);
    };
  }, []);

  // Handle permanent dismiss
  const handleDismiss = () => {
    localStorage.setItem('collision-suggestion-dismissed', 'true');
    setIsDismissedPermanently(true);
    onDismiss();
  };

  if (!isVisible || totalIssues === 0 || isDismissedPermanently) return null;

  const getUrgencyIcon = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getDirectionIcon = (direction: 'horizontal' | 'vertical') => {
    return direction === 'horizontal' ? 
      <ArrowRight className="h-3 w-3" /> : 
      <ArrowDown className="h-3 w-3" />;
  };

  const getSeverityColor = (severity: 'minor' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe': return 'bg-red-100 border-red-300 text-red-800';
      case 'moderate': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  // Compact mode - just a small notification
  if (compact) {
    return (
      <TooltipProvider>
        <div className="fixed bottom-4 right-4 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="bg-white shadow-lg border-blue-200 hover:bg-blue-50"
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                {totalIssues} spacing {totalIssues === 1 ? 'issue' : 'issues'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{recommendation}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-64'
      }`}>
        <Card className="shadow-lg border-blue-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minimize2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Widget Spacing</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {totalIssues}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              {recommendation}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Overlapping widgets (critical) */}
            {overlappingPairs.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overlapping Widgets
                </h4>
                {overlappingPairs.slice(0, 2).map((pair) => (
                  <div
                    key={`overlap-${pair.widget1.id}-${pair.widget2.id}`}
                    className={`text-xs p-2 rounded mb-1 ${getSeverityColor(pair.severity)}`}
                  >
                    <div className="font-medium">
                      {pair.widget1.title} & {pair.widget2.title}
                    </div>
                    <div className="opacity-75">
                      {pair.severity} overlap ({pair.overlapArea} units)
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Touching widgets */}
            {touchingPairs.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Touching Widgets
                </h4>
                
                {/* Show top priority pairs */}
                {touchingPairs.slice(0, isExpanded ? 5 : 2).map((pair) => (
                  <div
                    key={`touching-${pair.widget1.id}-${pair.widget2.id}`}
                    className="bg-gray-50 rounded p-2 mb-2 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {getUrgencyIcon(pair.urgency)}
                        <span className="text-xs font-medium">
                          {pair.widget1.title} & {pair.widget2.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getDirectionIcon(pair.separationType)}
                        <Badge variant="outline" className="text-xs">
                          {pair.urgency}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcceptSeparation(pair)}
                        className="h-6 px-2 text-xs"
                      >
                        Separate
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Show more button */}
                {touchingPairs.length > 2 && !isExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="w-full h-6 text-xs"
                  >
                    +{touchingPairs.length - 2} more pairs
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {touchingPairs.length > 1 && (
                <Button
                  size="sm"
                  onClick={onSeparateAll}
                  className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Minimize2 className="h-3 w-3 mr-1" />
                  Separate All
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="h-8 px-3 text-xs"
              >
                Dismiss
              </Button>
            </div>

            {/* Collapse button */}
            {isExpanded && touchingPairs.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="w-full h-6 mt-2 text-xs"
              >
                Show Less
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default CollisionSuggestion; 