// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LeadMetricsService, HEAT_LEVEL_CONFIG, STATE_MAPPING, STATUS_MAPPING } from '@/services/leadMetricsService';
import { useProject } from '@/context/ProjectContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Target,
  Flame,
  BarChart3,
  Activity,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const LeadMetricsDashboard: React.FC = () => {
  const { currentProject } = useProject();
  const { t } = useTranslation(['leads', 'common']);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [currentProject?.id]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await LeadMetricsService.getLeadMetrics(currentProject?.id);
      const heatAnalytics = await LeadMetricsService.getHeatAnalytics(currentProject?.id);
      const bantRate = await LeadMetricsService.getBANTQualificationRate(currentProject?.id);
      
      setMetrics({
        ...data,
        heatAnalytics,
        bantRate
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Across all states
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.heatAnalytics.hotLeadsCount}</div>
            <p className="text-xs text-muted-foreground">
              Confidence &gt; 66%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Ready to close
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Set</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.meetingsSet}</div>
            <p className="text-xs text-muted-foreground">
              Demos scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* State Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Lead State Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.stateDistribution).map(([state, count]) => {
              const percentage = metrics.totalLeads > 0 
                ? ((count as number) / metrics.totalLeads) * 100 
                : 0;
              
              return (
                <div key={state} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{state}</span>
                    <span className="text-sm text-muted-foreground">
                      {count as number} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Heat Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Heat Level Distribution (Confidence Score)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.heatDistribution).map(([heat, count]) => {
              const config = HEAT_LEVEL_CONFIG[heat as keyof typeof HEAT_LEVEL_CONFIG];
              if (!config) return null;
              
              return (
                <div key={heat} className="text-center">
                  <div className="text-3xl mb-2">{config.emoji}</div>
                  <div className="font-semibold">{config.label}</div>
                  <div className="text-sm text-muted-foreground">{config.range}</div>
                  <div className="text-2xl font-bold mt-2">{count as number}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Average Confidence Score: {(metrics.heatAnalytics.averageScore * 100).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* BANT Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>BANT Qualification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-2xl font-bold">
              {metrics.bantRate.qualificationRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Overall qualification rate
            </p>
          </div>
          <div className="space-y-3">
            {Object.entries(metrics.bantDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution (Engagement Levels) */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(metrics.statusDistribution)
              .filter(([_, count]) => (count as number) > 0)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{status}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 