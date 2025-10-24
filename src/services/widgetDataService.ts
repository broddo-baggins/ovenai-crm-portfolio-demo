import { Lead, Project, Client } from "@/types";
import { SimpleProjectService } from "./simpleProjectService";
import { simpleProjectService } from "./simpleProjectService";

export interface WidgetData {
  totalLeads?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown: {
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
  reachedLeads?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown: {
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
  conversationsCompleted?: {
    total: number;
    trend: number;
    timeRange: string;
    conversionRate: number;
    breakdown: {
      meetings: number;
      sales: number;
      followUps: number;
    };
  };
  heatDistribution?: {
    hot: number;
    warm: number;
    cool: number;
    cold: number;
  };
  totalChats?: {
    total: number;
    trend: number;
    timeRange: string;
    breakdown: {
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
}

class WidgetDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private simpleProjectService = simpleProjectService;

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  async getWidgetData(userId: string, projectId?: string): Promise<WidgetData> {
    const cacheKey = `widgets-${userId}-${projectId || "all"}`;

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const [dashboardStats, leads, conversations] = await Promise.all([
        this.simpleProjectService.getDashboardStats(),
        this.simpleProjectService.getAllLeads(),
        this.simpleProjectService.getAllConversations(),
      ]);

      // Filter by project if specified
      const projectLeads = projectId
        ? leads.filter((lead) => lead.current_project_id === projectId)
        : leads;

      const projectConversations = projectId
        ? conversations.filter((conv) => {
            const lead = leads.find((l) => l.id === conv.lead_id);
            return lead?.current_project_id === projectId;
          })
        : conversations;

      // Calculate time-based data (mock for now since we need date filtering)
      const now = new Date();
      const thisWeekStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay(),
      );
      const lastWeekStart = new Date(
        thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
      );
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Calculate metrics based on real data
      const totalLeads = projectLeads.length;
      const leadsWithConversations = new Set(
        projectConversations.map((c) => c.lead_id),
      );
      const reachedLeads = projectLeads.filter((lead) =>
        leadsWithConversations.has(lead.id),
      ).length;
      const completedConversations = projectConversations.filter(
        (c) => c.status === "completed",
      ).length;

      // Calculate heat/temperature distribution based on lead statuses
      const heatDistribution = projectLeads.reduce(
        (acc, lead) => {
          const status = lead.status || "new";
          switch (status) {
            case "converted":
              acc.hot += 1;
              break;
            case "qualified":
            case "active":
              acc.warm += 1;
              break;
            case "contacted":
              acc.cool += 1;
              break;
            default:
              acc.cold += 1;
          }
          return acc;
        },
        { hot: 0, warm: 0, cool: 0, cold: 0 },
      );

      const widgetData: WidgetData = {
        totalLeads: {
          total: totalLeads,
          trend: Math.random() * 20 - 10, // Random trend for demo
          timeRange: "last week",
          breakdown: {
            thisWeek: Math.floor(totalLeads * 0.12),
            lastWeek: Math.floor(totalLeads * 0.11),
            thisMonth: Math.floor(totalLeads * 0.45),
            lastMonth: Math.floor(totalLeads * 0.42),
          },
        },
        reachedLeads: {
          total: reachedLeads,
          trend: Math.random() * 20 - 5,
          timeRange: "last week",
          breakdown: {
            thisWeek: Math.floor(reachedLeads * 0.12),
            lastWeek: Math.floor(reachedLeads * 0.11),
            thisMonth: Math.floor(reachedLeads * 0.45),
            lastMonth: Math.floor(reachedLeads * 0.42),
          },
        },
        conversationsCompleted: {
          total: completedConversations,
          trend: Math.random() * 25 - 5,
          timeRange: "This Week",
          conversionRate:
            reachedLeads > 0
              ? Math.round((completedConversations / reachedLeads) * 100 * 10) /
                10
              : 0,
          breakdown: {
            meetings: Math.floor(completedConversations * 0.75),
            sales: Math.floor(completedConversations * 0.17),
            followUps: Math.floor(completedConversations * 0.08),
          },
        },
        heatDistribution,
        totalChats: {
          total: projectConversations.length,
          trend: Math.random() * 15 - 2,
          timeRange: "This Week",
          breakdown: {
            thisWeek: Math.floor(projectConversations.length * 0.18),
            lastWeek: Math.floor(projectConversations.length * 0.16),
            thisMonth: Math.floor(projectConversations.length * 0.65),
            lastMonth: Math.floor(projectConversations.length * 0.58),
          },
        },
      };

      this.setCache(cacheKey, widgetData);
      return widgetData;
    } catch (error) {
      console.error("Error fetching widget data:", error);

      // Return zeros instead of mock data
      return {
        totalLeads: {
          total: 0,
          trend: 0,
          timeRange: "last week",
          breakdown: { thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 },
        },
        reachedLeads: {
          total: 0,
          trend: 0,
          timeRange: "last week",
          breakdown: { thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 },
        },
        conversationsCompleted: {
          total: 0,
          trend: 0,
          timeRange: "This Week",
          conversionRate: 0,
          breakdown: { meetings: 0, sales: 0, followUps: 0 },
        },
        heatDistribution: { hot: 0, warm: 0, cool: 0, cold: 0 },
        totalChats: {
          total: 0,
          trend: 0,
          timeRange: "This Week",
          breakdown: { thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 },
        },
      };
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
        key.includes(userId),
      );
      keysToDelete.forEach((key) => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}

export const widgetDataService = new WidgetDataService();
