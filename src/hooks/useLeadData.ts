import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { LeadTemperature, LeadStatusValue } from '@/config/leadStates';

// Define the Lead type based on our Supabase schema
export interface Lead {
  id: string;
  project_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  temperature: LeadTemperature;
  status: LeadStatusValue;
  type: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

// Define Lead import data interface
export interface LeadImportData {
  projectId: string;
  leads: Array<Partial<Lead> & { id: string }>;  // Ensure id is required
}

/**
 * Hook to fetch leads data from Supabase
 */
export const useLeads = (projectId?: string) => {
  return useQuery({
    queryKey: ['leads', { projectId }],
    queryFn: async () => {
      let query = supabase.from('leads').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as Lead[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    gcTime: 10 * 60 * 1000,
    meta: {
      onError: (error) => {
        toast.error(`Failed to load leads: ${error.message}`);
      }
    }
  });
};

/**
 * Hook to import leads to Supabase
 */
export const useImportLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LeadImportData) => {
      const { projectId, leads } = data;
      
      // Prepare leads with project_id and ensure id is present
      const leadsWithProject = leads.map(lead => ({
        ...lead,
        project_id: projectId,
        id: lead.id // Ensure id is present and required
      }));
      
      // Insert leads in batches to avoid payload limits
      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < leadsWithProject.length; i += batchSize) {
        const batch = leadsWithProject.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('leads')
          .upsert(batch, { onConflict: 'id' });
          
        if (error) {
          throw new Error(`Error importing leads: ${error.message}`);
        }
        
        imported += batch.length;
      }
      
      return { imported };
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.imported} leads`);
      // Invalidate the leads query to refetch data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
};

/**
 * Hook to analyze leads data for temperature distribution
 */
export const useTemperatureDistribution = (projectId?: string) => {
  const { data: leads, isLoading, error } = useLeads(projectId);
  
  const temperatureData = useMemo(() => {
    if (!leads || !leads.length) return [];
    
    // Count leads by temperature category
    const cold = leads.filter(lead => lead.temperature === 'Cold').length;
    const cool = leads.filter(lead => lead.temperature === 'Cool').length;
    const warm = leads.filter(lead => lead.temperature === 'Warm').length;
    const hot = leads.filter(lead => lead.temperature === 'Hot').length;
    const scheduled = leads.filter(lead => lead.temperature === 'Scheduled').length;
    
    return [
      { name: "Cold", value: cold || 0, color: "#B0BEC5" },
      { name: "Cool", value: cool || 0, color: "#64B5F6" },
      { name: "Warm", value: warm || 0, color: "#FFB74D" },
      { name: "Hot", value: hot || 0, color: "#E53935" },
      { name: "Scheduled", value: scheduled || 0, color: "#8E24AA" },
    ].filter(item => item.value > 0); // Remove empty categories
  }, [leads]);
  
  return { 
    temperatureData, 
    isLoading, 
    error: error instanceof Error ? error.message : undefined 
  };
};

/**
 * Hook to extract lead funnel data
 */
export const useFunnelData = (projectId?: string) => {
  const { data: leads, isLoading, error } = useLeads(projectId);
  
  const funnelData = useMemo(() => {
    if (!leads || !leads.length) return [];
    
    // Count leads by status category
    const new_leads = leads.filter(lead => lead.status === LeadStatusValue.NEW).length;
    const preQualified = leads.filter(lead => lead.status === LeadStatusValue.PRE_QUALIFIED).length;
    const hook = leads.filter(lead => lead.status === LeadStatusValue.HOOK).length;
    const valueProposition = leads.filter(lead => lead.status === LeadStatusValue.VALUE_PROPOSITION).length;
    const questionsAsked = leads.filter(lead => lead.status === LeadStatusValue.QUESTIONS_ASKED).length;
    const engaged = leads.filter(lead => lead.status === LeadStatusValue.ENGAGED).length;
    const qualified = leads.filter(lead => lead.status === LeadStatusValue.QUALIFIED).length;
    const booked = leads.filter(lead => lead.status === LeadStatusValue.BOOKED).length;
    
    return [
      { name: "New", count: new_leads || 0, color: "#B0BEC5" },
      { name: "Pre-Qualified", count: preQualified || 0, color: "#B0BEC5" },
      { name: "Hook", count: hook || 0, color: "#64B5F6" },
      { name: "Value Prop", count: valueProposition || 0, color: "#64B5F6" },
      { name: "Questions", count: questionsAsked || 0, color: "#64B5F6" },
      { name: "Engaged", count: engaged || 0, color: "#FFB74D" },
      { name: "Qualified", count: qualified || 0, color: "#FFB74D" },
      { name: "Booked", count: booked || 0, color: "#8E24AA" },
    ];
  }, [leads]);
  
  return { 
    funnelData, 
    isLoading, 
    error: error instanceof Error ? error.message : undefined
  };
};
