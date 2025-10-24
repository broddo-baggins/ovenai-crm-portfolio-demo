import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { DashboardWidget } from '@/components/shared';
import LeadService from '@/services/leadService';
import { toast } from 'sonner';

const TotalLeadsReal: React.FC = () => {
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [previousPeriod, setPreviousPeriod] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data from Supabase
  useEffect(() => {
    loadLeadData();

    // Listen for project changes
    const handleProjectChange = () => {
      loadLeadData();
    };

    window.addEventListener('project-changed', handleProjectChange);
    return () => window.removeEventListener('project-changed', handleProjectChange);
  }, []);

  const loadLeadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current project from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (currentProjectId) {
        // Get leads for current project
        const leads = await LeadService.getLeadsByProject(currentProjectId);
        setTotalLeads(leads.length);

        // Calculate previous period (mock calculation for now)
        // In a real app, you'd query leads from a previous time period
        const mockPreviousPeriod = Math.floor(leads.length * 0.85);
        setPreviousPeriod(mockPreviousPeriod);
      } else {
        // No project selected, get all leads
        const leadStats = await LeadService.getLeadStats();
        setTotalLeads(leadStats.totalLeads);
        setPreviousPeriod(Math.floor(leadStats.totalLeads * 0.85));
      }
    } catch (error) {
      console.error('Error loading lead data:', error);
      setError('Failed to load lead data');
      toast.error('Failed to load lead statistics');
      
      // Fallback to mock data
      setTotalLeads(0);
      setPreviousPeriod(0);
    } finally {
      setLoading(false);
    }
  };

  const percentageChange = previousPeriod > 0 
    ? ((totalLeads - previousPeriod) / previousPeriod * 100).toFixed(1)
    : '0.0';
  const isPositive = totalLeads >= previousPeriod;

  return (
    <DashboardWidget
      title="Total Leads (Real Data)"
      titleKey="totalLeads.title"
      subtitle={error || "Real leads from Supabase"}
      subtitleKey="totalLeads.subtitle"
      value={loading ? '...' : totalLeads}
      icon={loading ? <RefreshCw className="animate-spin" /> : <Users />}
      iconColor={error ? "text-red-600" : "text-blue-600"}
      trend={{
        value: `${percentageChange}%`,
        positive: isPositive,
        label: isPositive ? 'Increase' : 'Decrease'
      }}
      stats={[
        {
          label: "Previous period",
          value: loading ? '...' : previousPeriod,
        },
        {
          label: "Current project",
          value: localStorage.getItem('currentProjectId')?.slice(0, 8) || 'All projects',
        },
        {
          label: "This period",
          value: loading ? '...' : totalLeads,
          highlighted: true
        }
      ]}
    />
  );
};

export default TotalLeadsReal; 