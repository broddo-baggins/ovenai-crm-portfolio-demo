import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useProject } from "@/context/ProjectContext";
import { DashboardAnalyticsService } from "@/services/dashboardAnalyticsService";

interface LeadFunnelProps {
  data?: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

const LeadFunnel = ({ data }: LeadFunnelProps) => {
  const { currentProject } = useProject();
  const [funnelData, setFunnelData] = useState<{
    stage: string;
    count: number;
    percentage: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFunnelData = async () => {
      try {
        setLoading(true);
        const analyticsService = new DashboardAnalyticsService();
        const metrics = await analyticsService.getDashboardMetrics(currentProject?.id);
        
        // Calculate real funnel data based on BANT progression
        const totalLeads = metrics.lead_temperature_distribution.total;
        const coldLeads = metrics.lead_temperature_distribution.cold;
        const warmLeads = metrics.lead_temperature_distribution.warm;
        const hotLeads = metrics.lead_temperature_distribution.hot;
        const burningLeads = metrics.lead_temperature_distribution.burning;
        const qualifiedLeads = metrics.bant_qualification_rate.qualified_count;
        const meetingsScheduled = metrics.meeting_pipeline.meetings_this_week;

        const realFunnelData = [
          { 
            stage: 'New Leads', 
            count: totalLeads, 
            percentage: 100 
          },
          { 
            stage: 'Contacted', 
            count: warmLeads + hotLeads + burningLeads, 
            percentage: totalLeads > 0 ? Math.round(((warmLeads + hotLeads + burningLeads) / totalLeads) * 100) : 0
          },
          { 
            stage: 'Engaged', 
            count: hotLeads + burningLeads, 
            percentage: totalLeads > 0 ? Math.round(((hotLeads + burningLeads) / totalLeads) * 100) : 0
          },
          { 
            stage: 'Qualified', 
            count: qualifiedLeads, 
            percentage: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0
          },
          { 
            stage: 'Meetings', 
            count: meetingsScheduled, 
            percentage: totalLeads > 0 ? Math.round((meetingsScheduled / totalLeads) * 100) : 0
          }
        ];

        setFunnelData(realFunnelData);
      } catch (error) {
        console.error('Error loading funnel data:', error);
        // Fallback to basic mock data
        setFunnelData([
          { stage: 'New Leads', count: 0, percentage: 100 },
          { stage: 'Contacted', count: 0, percentage: 0 },
          { stage: 'Engaged', count: 0, percentage: 0 },
          { stage: 'Qualified', count: 0, percentage: 0 },
          { stage: 'Meetings', count: 0, percentage: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [currentProject?.id]);

  const displayData = data || funnelData;

  if (loading) {
    return (
      <div className="h-full flex flex-col p-3 overflow-hidden widget-content">
        <div className="mb-3">
          <h3 className="widget-title font-medium text-gray-700">Lead Conversion Funnel</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading funnel data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden widget-content">
      <div className="mb-3">
        <h3 className="widget-title font-medium text-gray-700">Lead Conversion Funnel</h3>
        <p className="text-xs text-gray-500 mt-1">Real-time lead progression through sales funnel</p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto breakdown-section space-y-4">
        {displayData.map((stage, index) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="widget-title font-medium text-gray-900 truncate">{stage.stage}</span>
              <span className="widget-title font-bold text-gray-900 flex-shrink-0 ml-2">{stage.count}</span>
            </div>
            <Progress value={stage.percentage} className="h-3" />
            <div className="flex justify-between items-center">
              <span className="widget-description text-muted-foreground">
                {index > 0 ? `${((stage.count / Math.max(displayData[index - 1].count, 1)) * 100).toFixed(1)}% conversion` : 'Starting point'}
              </span>
              <span className="widget-description text-muted-foreground">
                {stage.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadFunnel; 