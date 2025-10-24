
import { useMutation } from '@tanstack/react-query';
import apiService, { ReportType } from '../services/apiService';
import { toast } from "sonner";

/**
 * Hook for generating reports via AWS Lambda
 * 
 * Uses React Query mutation for API interaction
 */
export const useGenerateReport = () => {
  return useMutation({
    mutationFn: ({ type, params }: { type: ReportType, params?: Record<string, any> }) => 
      apiService.generateReport(type, params),
    onSuccess: (data) => {
      console.log('Report generated successfully from AWS Lambda');
      
      // Create a download link for the PDF blob
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Report generated and downloaded successfully');
    },
    onError: (error: Error) => {
      console.error('AWS Lambda report generation error:', error);
      toast.error(`Report generation failed: ${error.message}`);
    },
  });
};

/**
 * Hook for scheduling reports via AWS EventBridge
 * 
 * Uses React Query mutation for API interaction
 */
export const useScheduleReport = () => {
  return useMutation({
    mutationFn: ({ type, email, schedule }: { type: ReportType, email: string, schedule: string }) => 
      apiService.scheduleReport(type, email, schedule),
    onSuccess: () => {
      console.log('Report scheduled successfully with AWS EventBridge');
      toast.success('Report scheduled successfully');
    },
    onError: (error: Error) => {
      console.error('AWS EventBridge scheduling error:', error);
      toast.error(`Report scheduling failed: ${error.message}`);
    },
  });
};
