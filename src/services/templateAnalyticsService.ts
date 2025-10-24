// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import { simpleProjectService } from '@/services/simpleProjectService';
import { Lead } from '@/types/index';

export interface TemplateSuccessMetrics {
  templateId: string;
  content: string;
  usageCount: number;
  responseRate: number; // percentage of conversations that got a reply
  meetingRate: number; // percentage that led to meeting scheduled
  progressionRate: number; // percentage that moved beyond initial stage
  averageReplies: number;
  successScore: number; // weighted composite score
  language: 'Hebrew' | 'English' | 'Mixed';
  lastUsed: string;
}

export interface TemplateComparison {
  bestPerformingTemplate: TemplateSuccessMetrics;
  worstPerformingTemplate: TemplateSuccessMetrics;
  averageMetrics: TemplateSuccessMetrics;
  recommendations: string[];
}

class TemplateAnalyticsService {
  /**
   * Analyze template success based on lead data with message content
   * Groups leads by their message content (notes or lastMessage) to identify template patterns
   */
  async analyzeTemplateSuccess(projectId?: string): Promise<TemplateSuccessMetrics[]> {
    try {
      
      // Get all leads with message content
      const leads = await simpleProjectService.getAllLeads();

      if (!leads || leads.length === 0) {
        console.log('No leads found for template analysis');
        return [];
      }

      // Filter leads by project if specified
      let filteredLeads = leads;
      if (projectId && projectId !== 'all') {
        filteredLeads = leads.filter(lead => lead.current_project_id === projectId);
      }

      // Filter leads that have message content (use notes or lastMessage as template content)
      const leadsWithMessages = filteredLeads.filter(lead => {
        const messageContent = this.extractMessageContent(lead);
        return messageContent && messageContent.trim().length > 10; // Minimum message length
      });

      if (leadsWithMessages.length === 0) {
        console.log('No leads with sufficient message content found for template analysis');
        return [];
      }

      // Group leads by similar message content (template patterns)
      const templateGroups = this.groupMessagesByTemplate(leadsWithMessages);

      // Calculate metrics for each template group
      const templateMetrics: TemplateSuccessMetrics[] = [];

      for (const [templateContent, leadGroup] of templateGroups.entries()) {
        const metrics = this.calculateTemplateMetrics(templateContent, leadGroup);
        templateMetrics.push(metrics);
      }

      // Sort by success score (descending)
      templateMetrics.sort((a, b) => b.successScore - a.successScore);

      
      return templateMetrics;

    } catch (error) {
      console.error('Error analyzing template success:', error);
      return [];
    }
  }

  /**
   * Extract message content from lead data
   * Uses available fields like lastMessage or notes
   */
  private extractMessageContent(lead: Lead): string | null {
    // Try lastMessage first, then notes as fallback
    return lead.lastMessage || lead.notes || null;
  }

  /**
   * Group leads by similar message content to identify template patterns
   * Uses basic similarity matching to group similar messages
   */
  private groupMessagesByTemplate(leads: Lead[]): Map<string, Lead[]> {
    const templateGroups = new Map<string, Lead[]>();

    for (const lead of leads) {
      const content = this.extractMessageContent(lead);
      if (!content) continue;

      // Find similar existing template or create new group
      let foundGroup = false;
      for (const [existingTemplate, group] of templateGroups.entries()) {
        if (this.areMessagesSimilar(content, existingTemplate)) {
          group.push(lead);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        templateGroups.set(content, [lead]);
      }
    }

    // Filter out groups with less than 3 leads (not enough data)
    const filteredGroups = new Map<string, Lead[]>();
    for (const [template, group] of templateGroups.entries()) {
      if (group.length >= 3) {
        filteredGroups.set(template, group);
      }
    }

    return filteredGroups;
  }

  /**
   * Simple similarity check for grouping similar messages
   * Can be enhanced with more sophisticated NLP in the future
   */
  private areMessagesSimilar(message1: string, message2: string): boolean {
    // Remove names, numbers, and common variables to compare template structure
    const normalize = (msg: string) => {
      return msg
        .replace(/\[[^\]]+\]/g, '[VAR]') // Replace [variables]
        .replace(/\d+/g, 'NUM') // Replace numbers
        .replace(/[א-ת]+/g, 'HEB') // Replace Hebrew words
        .replace(/[a-zA-Z]+/g, 'ENG') // Replace English words
        .toLowerCase()
        .trim();
    };

    const norm1 = normalize(message1);
    const norm2 = normalize(message2);

    // Calculate simple similarity
    const similarity = this.calculateStringSimilarity(norm1, norm2);
    return similarity > 0.7; // 70% similarity threshold
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate success metrics for a template group
   */
  private calculateTemplateMetrics(templateContent: string, leads: Lead[]): TemplateSuccessMetrics {
    const usageCount = leads.length;
    
    // Use messageCount if available, otherwise estimate from interaction_count
    const leadsWithReplies = leads.filter(lead => 
      (lead.messageCount && lead.messageCount > 1) || 
      (lead.interaction_count && lead.interaction_count > 1)
    );
    
    // Look for leads that might have meetings (check various status fields)
    const meetingsScheduled = leads.filter(lead => 
      lead.status?.toLowerCase().includes('meeting') ||
      lead.status?.toLowerCase().includes('scheduled') ||
      lead.state?.toLowerCase().includes('meeting')
    );
    
    // Progressive leads - those with higher interaction counts or certain statuses
    const progressedLeads = leads.filter(lead => 
      lead.status?.toLowerCase().includes('completed') ||
      lead.status?.toLowerCase().includes('converted') ||
      lead.status?.toLowerCase().includes('qualified') ||
      (lead.interaction_count && lead.interaction_count > 2)
    );

    const responseRate = (leadsWithReplies.length / usageCount) * 100;
    const meetingRate = (meetingsScheduled.length / usageCount) * 100;
    const progressionRate = (progressedLeads.length / usageCount) * 100;
    
    // Calculate average interactions/replies
    const averageReplies = leads.reduce((sum, lead) => {
      return sum + (lead.messageCount || lead.interaction_count || 0);
    }, 0) / usageCount;

    // Calculate weighted success score
    const successScore = (
      responseRate * 0.4 + // 40% weight on getting responses
      meetingRate * 0.4 + // 40% weight on scheduling meetings
      progressionRate * 0.2 // 20% weight on lead progression
    );

    // Detect language
    const hasHebrew = /[א-ת]/.test(templateContent);
    const hasEnglish = /[a-zA-Z]/.test(templateContent);
    let language: 'Hebrew' | 'English' | 'Mixed' = 'English';
    if (hasHebrew && hasEnglish) language = 'Mixed';
    else if (hasHebrew) language = 'Hebrew';

    // Get most recent usage
    const lastUsed = leads
      .map(lead => lead.created_at)
      .sort()
      .reverse()[0] || new Date().toISOString();

    return {
      templateId: this.generateTemplateId(templateContent),
      content: templateContent.slice(0, 200) + (templateContent.length > 200 ? '...' : ''),
      usageCount,
      responseRate: Math.round(responseRate * 100) / 100,
      meetingRate: Math.round(meetingRate * 100) / 100,
      progressionRate: Math.round(progressionRate * 100) / 100,
      averageReplies: Math.round(averageReplies * 100) / 100,
      successScore: Math.round(successScore * 100) / 100,
      language,
      lastUsed
    };
  }

  /**
   * Generate a unique template ID from content
   */
  private generateTemplateId(content: string): string {
    // Simple hash function for template ID
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `template_${Math.abs(hash)}`;
  }

  /**
   * Compare templates and provide insights
   */
  async compareTemplates(projectId?: string): Promise<TemplateComparison> {
    const templates = await this.analyzeTemplateSuccess(projectId);
    
    if (templates.length === 0) {
      throw new Error('No template data available for comparison');
    }

    const bestPerformingTemplate = templates[0];
    const worstPerformingTemplate = templates[templates.length - 1];
    
    // Calculate average metrics
    const totalTemplates = templates.length;
    const averageMetrics: TemplateSuccessMetrics = {
      templateId: 'average',
      content: 'Average across all templates',
      usageCount: Math.round(templates.reduce((sum, t) => sum + t.usageCount, 0) / totalTemplates),
      responseRate: Math.round((templates.reduce((sum, t) => sum + t.responseRate, 0) / totalTemplates) * 100) / 100,
      meetingRate: Math.round((templates.reduce((sum, t) => sum + t.meetingRate, 0) / totalTemplates) * 100) / 100,
      progressionRate: Math.round((templates.reduce((sum, t) => sum + t.progressionRate, 0) / totalTemplates) * 100) / 100,
      averageReplies: Math.round((templates.reduce((sum, t) => sum + t.averageReplies, 0) / totalTemplates) * 100) / 100,
      successScore: Math.round((templates.reduce((sum, t) => sum + t.successScore, 0) / totalTemplates) * 100) / 100,
      language: 'Mixed',
      lastUsed: new Date().toISOString()
    };

    const recommendations = this.generateRecommendations(templates, bestPerformingTemplate, worstPerformingTemplate);

    return {
      bestPerformingTemplate,
      worstPerformingTemplate,
      averageMetrics,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations based on template analysis
   */
  private generateRecommendations(
    templates: TemplateSuccessMetrics[],
    best: TemplateSuccessMetrics,
    worst: TemplateSuccessMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Response rate recommendations
    if (best.responseRate > worst.responseRate + 20) {
      recommendations.push(`Your best template gets ${best.responseRate}% responses vs ${worst.responseRate}% for your worst. Consider using similar language patterns.`);
    }

    // Meeting rate recommendations
    if (best.meetingRate > worst.meetingRate + 15) {
      recommendations.push(`Templates with clear call-to-action get ${best.meetingRate}% meeting bookings vs ${worst.meetingRate}%. Focus on direct meeting requests.`);
    }

    // Language recommendations
    const languagePerformance = templates.reduce((acc, t) => {
      if (!acc[t.language]) acc[t.language] = { total: 0, score: 0 };
      acc[t.language].total++;
      acc[t.language].score += t.successScore;
      return acc;
    }, {} as Record<string, { total: number; score: number }>);

    const avgScores = Object.entries(languagePerformance).map(([lang, data]) => ({
      language: lang,
      avgScore: data.score / data.total
    }));

    if (avgScores.length > 1) {
      const bestLang = avgScores.reduce((a, b) => a.avgScore > b.avgScore ? a : b);
      recommendations.push(`${bestLang.language} templates perform ${Math.round(bestLang.avgScore)}% better on average.`);
    }

    // Usage recommendations
    const avgUsage = templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.length;
    const underUsedTemplates = templates.filter(t => t.usageCount < avgUsage * 0.5 && t.successScore > avgScores[0]?.avgScore);
    
    if (underUsedTemplates.length > 0) {
      recommendations.push(`You have ${underUsedTemplates.length} high-performing templates that are underused. Consider promoting them.`);
    }

    // Timing recommendations
    if (templates.length >= 5) {
      recommendations.push(`Test your top 3 templates at different times of day to optimize response rates.`);
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Get template performance over time for trend analysis
   */
  async getTemplatePerformanceOverTime(templateId: string, days: number = 30): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const leads = await simpleProjectService.getAllLeads();
      
      if (!leads || leads.length === 0) {
        console.log('No leads found for performance analysis');
        return [];
      }

      // Filter by template and date range
      const templateLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        const messageContent = this.extractMessageContent(lead);
        return leadDate >= startDate && leadDate <= endDate &&
               messageContent && this.generateTemplateId(messageContent) === templateId;
      });

      // Group by day and calculate daily metrics
      const dailyMetrics = new Map();
      
      templateLeads.forEach(lead => {
        const day = lead.created_at.split('T')[0]; // Get YYYY-MM-DD
        if (!dailyMetrics.has(day)) {
          dailyMetrics.set(day, {
            date: day,
            leads: [],
            responseRate: 0,
            meetingRate: 0
          });
        }
        dailyMetrics.get(day).leads.push(lead);
      });

      // Calculate metrics for each day
      const timeSeriesData = Array.from(dailyMetrics.values()).map(dayData => {
        const leads = dayData.leads;
        const totalLeads = leads.length;
        const responsesCount = leads.filter((lead: Lead) => 
          (lead.messageCount && lead.messageCount > 1) || 
          (lead.interaction_count && lead.interaction_count > 1)
        ).length;
        const meetingsCount = leads.filter((lead: Lead) => 
          lead.status?.toLowerCase().includes('meeting') ||
          lead.status?.toLowerCase().includes('scheduled')
        ).length;

        return {
          date: dayData.date,
          leads: totalLeads,
          responseRate: totalLeads > 0 ? (responsesCount / totalLeads) * 100 : 0,
          meetingRate: totalLeads > 0 ? (meetingsCount / totalLeads) * 100 : 0
        };
      });

      return timeSeriesData.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('Error getting template performance over time:', error);
      return [];
    }
  }
}

export const templateAnalyticsService = new TemplateAnalyticsService();
export default templateAnalyticsService; 