import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Save, RotateCcw } from 'lucide-react';
import { CollisionDetectorOptions } from '@/utils/collisionDetector';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SpacingConfigPanelProps {
  options: CollisionDetectorOptions;
  onChange: (options: CollisionDetectorOptions) => void;
  onSave?: () => void;
  onReset?: () => void;
}

const DEFAULT_OPTIONS: CollisionDetectorOptions = {
  minSpacingThreshold: 0.5,
  ignoreDiagonalTouching: true,
  considerVisualSpacing: true
};

const SpacingConfigPanel: React.FC<SpacingConfigPanelProps> = ({
  options,
  onChange,
  onSave,
  onReset
}) => {
  const handleThresholdChange = (value: number[]) => {
    onChange({
      ...options,
      minSpacingThreshold: value[0]
    });
  };

  const handleDiagonalChange = (checked: boolean) => {
    onChange({
      ...options,
      ignoreDiagonalTouching: checked
    });
  };

  const handleVisualSpacingChange = (checked: boolean) => {
    onChange({
      ...options,
      considerVisualSpacing: checked
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_OPTIONS);
    onReset?.();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Widget Spacing Configuration
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Adjust how sensitive the spacing detection is</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Minimum Spacing Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="spacing-threshold">
              Minimum Spacing Threshold
            </Label>
            <span className="text-sm text-muted-foreground">
              {options.minSpacingThreshold ?? 0.5} grid units
            </span>
          </div>
          <Slider
            id="spacing-threshold"
            min={0}
            max={2}
            step={0.1}
            value={[options.minSpacingThreshold ?? 0.5]}
            onValueChange={handleThresholdChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Widgets closer than this distance will be flagged as touching. 
            Lower values = more strict detection.
          </p>
        </div>

        {/* Ignore Diagonal Touching */}
        <div className="flex items-center justify-between space-x-3">
          <div className="space-y-1">
            <Label htmlFor="diagonal-touching">
              Ignore Corner Touches
            </Label>
            <p className="text-xs text-muted-foreground">
              Don't flag widgets that only touch at corners
            </p>
          </div>
          <Switch
            id="diagonal-touching"
            checked={options.ignoreDiagonalTouching !== false}
            onCheckedChange={handleDiagonalChange}
          />
        </div>

        {/* Consider Visual Spacing */}
        <div className="flex items-center justify-between space-x-3">
          <div className="space-y-1">
            <Label htmlFor="visual-spacing">
              Consider Visual Margins
            </Label>
            <p className="text-xs text-muted-foreground">
              Account for CSS margins/padding in detection
            </p>
          </div>
          <Switch
            id="visual-spacing"
            checked={options.considerVisualSpacing !== false}
            onCheckedChange={handleVisualSpacingChange}
          />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ minSpacingThreshold: 0, ignoreDiagonalTouching: false, considerVisualSpacing: false })}
            >
              Strict
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ minSpacingThreshold: 0.5, ignoreDiagonalTouching: true, considerVisualSpacing: true })}
            >
              Balanced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ minSpacingThreshold: 1, ignoreDiagonalTouching: true, considerVisualSpacing: true })}
            >
              Relaxed
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            mobileOptimized={true}
          >
            Reset
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              className="flex-1"
              leftIcon={<Save className="h-4 w-4" />}
              mobileOptimized={true}
            >
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpacingConfigPanel; 