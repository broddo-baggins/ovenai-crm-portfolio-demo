import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Lock,
  Unlock,
  Activity,
  Layers,
  RotateCcw,
  BarChart3,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import ReportBuilder from "@/components/reports/ReportBuilder";
import { WidgetConfig } from "@/types/widgets";

interface NewDashboardToolbarProps {
  isGlobalLocked: boolean;
  onToggleGlobalLock: () => void;
  hasUnsavedChanges: boolean;
  onOrganizeWidgets: () => void;
  onAutoResize: () => void;
  onAddWidget: () => void;
  totalWidgets: number;
  activeWidgets: number;
  isDragging?: boolean;
  isResizing?: boolean;
  resizeMode?: "minimal" | "optimal" | "content-optimized";
  widgets?: WidgetConfig[];
}

const NewDashboardToolbar: React.FC<NewDashboardToolbarProps> = ({
  isGlobalLocked,
  onToggleGlobalLock,
  hasUnsavedChanges,
  onOrganizeWidgets,
  onAutoResize,
  onAddWidget,
  totalWidgets,
  activeWidgets,
  isDragging = false,
  isResizing = false,
  resizeMode = "optimal",
  widgets = [],
}) => {
  const isInteracting = isDragging || isResizing;
  const { t } = useTranslation("common");
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);

  // Get display text for current resize mode
  const getResizeModeLabel = (mode: string) => {
    switch (mode) {
      case "minimal":
        return "Minimal";
      case "optimal":
        return "Optimal";
      case "content-optimized":
        return "Content-Optimized";
      default:
        return "Optimal";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        {/* Left Section - Dashboard Info */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <Layers className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.title")}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-xs">
              {activeWidgets}/{totalWidgets} {t("dashboard.widgets")}
            </Badge>

            {isInteracting && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <Activity className="h-3 w-3 mr-1" />
                {isDragging ? t("dashboard.moving") : t("dashboard.resizing")}
              </Badge>
            )}

            {/* Auto-save status indicator - shows when changes are detected */}
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs">
                {t("dashboard.unsaved")} - Auto-saving...
              </Badge>
            )}

            {/* Auto-save working indicator - shows when everything is saved */}
            {!hasUnsavedChanges && !isInteracting && (
              <Badge
                variant="outline"
                className="text-xs text-green-600 border-green-200"
              >
                ✓ Auto-saved
              </Badge>
            )}

            {/* Current resize mode indicator */}
            <Badge
              variant="outline"
              className="text-xs text-purple-600 border-purple-200"
            >
              Mode: {resizeMode.replace("-", " ")}
            </Badge>
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-2">
          {/* Widget Management */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddWidget}
                  className="h-9 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={isInteracting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("toolbar.addWidget")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clear localStorage and show widget spacing notifications
                    localStorage.removeItem("collision-suggestion-dismissed");
                    window.dispatchEvent(
                      new CustomEvent("widget-spacing-toggle"),
                    );
                  }}
                  className="h-9 px-2 text-gray-600 hover:text-gray-800"
                  disabled={isInteracting}
                  title="Show widget spacing notifications"
                >
                  <div className="relative">
                    <div className="w-3 h-3 border-2 border-current rounded-sm"></div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border border-current rounded-sm"></div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Widget Spacing</TooltipContent>
            </Tooltip>
          </div>

          {/* Layout Controls */}
          {!isGlobalLocked && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAutoResize}
                    className="h-9 px-2 text-gray-600 hover:text-gray-800"
                    disabled={isInteracting}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {getResizeModeLabel(resizeMode)} Size
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOrganizeWidgets}
                    className="h-9 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                    disabled={isInteracting}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.organizeWidgets")}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Lock Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isGlobalLocked ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleGlobalLock}
                  className={`h-9 px-2 ${
                    isGlobalLocked
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                      : "text-gray-600 hover:text-gray-800 border-gray-300"
                  }`}
                  disabled={isInteracting}
                >
                  {isGlobalLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isGlobalLocked
                  ? t("toolbar.unlockWidgets")
                  : t("toolbar.lockWidgets")}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Report Generation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportBuilderOpen(true)}
                disabled={widgets.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <div className="font-medium">Generate Dashboard Report</div>
                <div className="text-sm text-gray-600 mt-1">
                  Create professional reports from your dashboard widgets in
                  PDF, PNG, HTML, or Excel format
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Report Builder Modal */}
      <ReportBuilder
        widgets={widgets}
        isOpen={isReportBuilderOpen}
        onClose={() => setIsReportBuilderOpen(false)}
      />
    </TooltipProvider>
  );
};

export default NewDashboardToolbar;
