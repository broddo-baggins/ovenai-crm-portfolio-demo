import React from "react";
import { QueryClient } from "@tanstack/react-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (
          error?.message?.includes("not authenticated") ||
          error?.message?.includes("AuthSessionMissingError")
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistency
export const queryKeys = {
  // Conversations
  conversations: ["conversations"] as const,
  conversationsList: (projectId?: string) =>
    [...queryKeys.conversations, "list", projectId] as const,
  conversationDetail: (id: string) =>
    [...queryKeys.conversations, "detail", id] as const,
  conversationMessages: (id: string) =>
    [...queryKeys.conversations, "messages", id] as const,

  // Messages
  messages: ["messages"] as const,
  messagesList: (limit?: number) =>
    [...queryKeys.messages, "list", limit] as const,
  leadMessages: (leadId: string) =>
    [...queryKeys.messages, "lead", leadId] as const,

  // Leads
  leads: ["leads"] as const,
  leadsList: (projectId?: string) =>
    [...queryKeys.leads, "list", projectId] as const,
  leadDetail: (id: string) => [...queryKeys.leads, "detail", id] as const,

  // Projects
  projects: ["projects"] as const,
  projectsList: () => [...queryKeys.projects, "list"] as const,
  projectDetail: (id: string) => [...queryKeys.projects, "detail", id] as const,

  // Dashboard
  dashboard: ["dashboard"] as const,
  dashboardStats: (projectId?: string) =>
    [...queryKeys.dashboard, "stats", projectId] as const,
} as const;

// Performance tracking for database operations
export const trackDatabasePerformance = (
  queryKey: string,
  queryTime: number,
  success: boolean,
) => {
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track("database_query_performance", {
      queryKey,
      queryTime,
      success,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  // Console logging for development
  if (process.env.NODE_ENV === "development") {
    // Performance logging disabled for production
  }
};

// Custom hook for tracking query performance
export const useQueryPerformance = () => {
  const performanceData = React.useRef({
    queryCount: 0,
    averageQueryTime: 0,
    errorRate: 0,
    lastQueryTime: 0,
  });

  const trackQuery = React.useCallback(
    (queryTime: number, success: boolean) => {
      const data = performanceData.current;
      data.queryCount++;
      data.averageQueryTime = (data.averageQueryTime + queryTime) / 2;
      data.lastQueryTime = queryTime;
      if (!success) data.errorRate++;

      return data;
    },
    [],
  );

  return {
    trackQuery,
    getMetrics: () => ({ ...performanceData.current }),
  };
};
