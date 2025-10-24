import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { WidgetConfig } from '@/types/widgets';
import { 
  DashboardReport, 
  ReportExportOptions,
  ReportGenerationProgress,
  ReportExportResult 
} from '@/types/dashboardReports';
import { DashboardReportGenerator } from '@/services/dashboardReportGenerator';
import { toast } from "sonner";

interface ReportBuilderProps {
  widgets: WidgetConfig[];
  isOpen: boolean;
  onClose: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  widgets,
  isOpen,
  onClose
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<'widgets' | 'template' | 'format' | 'export'>('widgets');
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [reportTitle, setReportTitle] = useState(`Dashboard Report - ${new Date().toLocaleDateString()}`);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('operational-dashboard');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'html' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<ReportGenerationProgress | null>(null);
  const [generatedReport, setGeneratedReport] = useState<DashboardReport | null>(null);
  const [exportResult, setExportResult] = useState<ReportExportResult | null>(null);

  // Get available templates
  const templates = DashboardReportGenerator.getTemplates();

  // Initialize with all widgets selected
  React.useEffect(() => {
    if (widgets.length > 0 && selectedWidgets.size === 0) {
      setSelectedWidgets(new Set(widgets.map(w => w.id)));
    }
  }, [widgets, selectedWidgets.size]);

  // Toggle widget selection
  const toggleWidget = useCallback((widgetId: string) => {
    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  }, []);

  // Select/deselect all widgets
  const toggleAllWidgets = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedWidgets(new Set(widgets.map(w => w.id)));
    } else {
      setSelectedWidgets(new Set());
    }
  }, [widgets]);

  // Generate report
  const generateReport = useCallback(async () => {
    if (selectedWidgets.size === 0) {
      toast.error('Please select at least one widget for the report');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(null);

    try {
      const report = await DashboardReportGenerator.generateReport(widgets, {
        title: reportTitle,
        template: selectedTemplate,
        selectedWidgets: Array.from(selectedWidgets),
        onProgress: setGenerationProgress
      });

      setGeneratedReport(report);
      setCurrentStep('export');
      
      toast.success('Report generated successfully!', {
        description: `${report.widgets.length} widgets included`
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [widgets, selectedWidgets, reportTitle, selectedTemplate]);

  // Export report
  const exportReport = useCallback(async () => {
    if (!generatedReport) return;

    setIsGenerating(true);
    
    try {
      const options: ReportExportOptions = {
        format: exportFormat,
        quality: 'high',
        includeData: true,
        includeSettings: false
      };

      const result = await DashboardReportGenerator.exportReport(generatedReport, options);
      setExportResult(result);

      if (result.success) {
        toast.success(`Report exported successfully!`, {
          description: `${result.filename} (${Math.round(result.size / 1024)} KB)`,
          action: {
            label: 'Download',
            onClick: () => {
              if (result.downloadUrl) {
                window.open(result.downloadUrl, '_blank');
              }
            }
          }
        });
      } else {
        toast.error('Export failed', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generatedReport, exportFormat]);

  // Reset to initial state
  const resetBuilder = useCallback(() => {
    setCurrentStep('widgets');
    setSelectedWidgets(new Set(widgets.map(w => w.id)));
    setGeneratedReport(null);
    setExportResult(null);
    setIsGenerating(false);
    setGenerationProgress(null);
  }, [widgets]);

  // Get selected template
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Dashboard Report
          </DialogTitle>
          <DialogDescription>
            Generate professional reports from your dashboard widgets
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[
            { key: 'widgets', label: 'Select Widgets', icon: Plus },
            { key: 'template', label: 'Choose Template', icon: Settings },
            { key: 'format', label: 'Format Options', icon: FileText },
            { key: 'export', label: 'Export Report', icon: Download }
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ['widgets', 'template', 'format'].indexOf(currentStep) > ['widgets', 'template', 'format'].indexOf(step.key);
            const StepIcon = step.icon;
            
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-100 border-2 border-blue-600' : 
                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Generation Progress */}
        {isGenerating && generationProgress && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{generationProgress.message}</span>
                <span className="text-xs text-gray-500">
                  {generationProgress.estimatedTimeRemaining}s remaining
                </span>
              </div>
              <Progress value={generationProgress.progress} className="mb-2" />
              <div className="text-xs text-gray-500">
                Stage: {generationProgress.stage} • {generationProgress.progress}%
                {generationProgress.currentWidget && ` • Processing: ${generationProgress.currentWidget}`}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto">
          <Tabs value={currentStep} onValueChange={(value: string) => setCurrentStep(value as "widgets" | "template" | "format" | "export")}>
            {/* Step 1: Widget Selection */}
            <TabsContent value="widgets" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Select Widgets</h3>
                  <p className="text-sm text-gray-600">Choose which widgets to include in your report</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllWidgets(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllWidgets(false)}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {widgets.map(widget => (
                  <Card key={widget.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedWidgets.has(widget.id)}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{widget.title}</div>
                        <div className="text-sm text-gray-500">
                          {widget.type} • {widget.gridLayout.w}×{widget.gridLayout.h}
                        </div>
                      </div>
                      <Badge variant={widget.enabled ? 'default' : 'secondary'}>
                        {widget.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-600">
                  {selectedWidgets.size} of {widgets.length} widgets selected
                </div>
                <Button onClick={() => setCurrentStep('template')} disabled={selectedWidgets.size === 0}>
                  Next: Choose Template
                </Button>
              </div>
            </TabsContent>

            {/* Step 2: Template Selection */}
            <TabsContent value="template" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Choose Template</h3>
                <p className="text-sm text-gray-600">Select a report template that fits your needs</p>
              </div>

              <div className="space-y-3">
                {templates.map(template => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'ring-2 ring-blue-600 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            {template.isDefault && (
                              <Badge variant="outline">Default</Badge>
                            )}
                            <Badge variant="secondary">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Layout: {template.layout}</span>
                            <span>Format: {template.formatting.pageSize || 'A4'}</span>
                            <span>Orientation: {template.formatting.orientation || 'portrait'}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {selectedTemplate === template.id && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('widgets')}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep('format')}>
                  Next: Format Options
                </Button>
              </div>
            </TabsContent>

            {/* Step 3: Format Options */}
            <TabsContent value="format" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Format Options</h3>
                <p className="text-sm text-gray-600">Customize your report title and settings</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="report-title">Report Title</Label>
                  <Input
                    id="report-title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                  />
                </div>

                {selectedTemplateData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Template Configuration</CardTitle>
                      <CardDescription>
                        {selectedTemplateData.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Page Size:</span> {selectedTemplateData.formatting.pageSize || 'A4'}
                        </div>
                        <div>
                          <span className="font-medium">Orientation:</span> {selectedTemplateData.formatting.orientation || 'Portrait'}
                        </div>
                        <div>
                          <span className="font-medium">Layout:</span> {selectedTemplateData.layout}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {selectedTemplateData.category}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('template')}>
                  Back
                </Button>
                <Button onClick={generateReport} disabled={isGenerating || selectedWidgets.size === 0}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Step 4: Export */}
            <TabsContent value="export" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Export Report</h3>
                <p className="text-sm text-gray-600">Choose your export format and download</p>
              </div>

              {generatedReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Title:</span> {generatedReport.title}
                      </div>
                      <div>
                        <span className="font-medium">Widgets:</span> {generatedReport.widgets.length}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {generatedReport.createdAt.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Generation Time:</span> {generatedReport.metadata.generationTime}ms
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: "pdf" | "png" | "html" | "excel") => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="png">PNG Image</SelectItem>
                      <SelectItem value="html">HTML Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportResult && (
                  <Card className={exportResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        {exportResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {exportResult.success ? 'Export Successful' : 'Export Failed'}
                        </span>
                      </div>
                      {exportResult.success ? (
                        <div className="mt-2 text-sm">
                          <div>File: {exportResult.filename}</div>
                          <div>Size: {Math.round(exportResult.size / 1024)} KB</div>
                          {exportResult.downloadUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => window.open(exportResult.downloadUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download File
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-red-600">
                          {exportResult.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('format')}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={resetBuilder}
                  >
                    Create New Report
                  </Button>
                  <Button 
                    onClick={exportReport} 
                    disabled={isGenerating || !generatedReport}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export {exportFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportBuilder; 