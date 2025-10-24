/**
 * Quiet Performance Targets Hook
 * Same functionality as regular performance targets but with suppressed console noise
 * Use this in dashboard components to avoid excessive logging
 */

import { useState, useEffect } from "react";
import {
  performanceTargetsService,
  type PerformanceTargets,
} from "@/services/performanceTargetsService";

export const usePerformanceTargetsQuiet = (
  projectId?: string,
  clientId?: string,
) => {
  const [targets, setTargets] = useState<PerformanceTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTargets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Suppress console warnings by wrapping in try-catch
        const originalWarn = console.warn;
        const originalError = console.error;

        // Temporarily suppress performance targets related warnings
        console.warn = (...args) => {
          const message = args.join(" ");
          if (
            !message.includes("Performance targets") &&
            !message.includes("user_performance_targets") &&
            !message.includes("PGRST116")
          ) {
            originalWarn.apply(console, args);
          }
        };

        console.error = (...args) => {
          const message = args.join(" ");
          if (
            !message.includes("Error fetching performance targets") &&
            !message.includes("user_performance_targets")
          ) {
            originalError.apply(console, args);
          }
        };

        const result = await performanceTargetsService.getUserTargets(
          projectId,
          clientId,
        );

        // Restore original console methods
        console.warn = originalWarn;
        console.error = originalError;

        if (mounted) {
          setTargets(result);
        }
      } catch (err) {
        if (mounted) {
          // Only set error if it's not a table-missing error
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (
            !errorMessage.includes("user_performance_targets") &&
            !errorMessage.includes("PGRST116") &&
            !errorMessage.includes("PGRST301") &&
            !errorMessage.includes("42P01")
          ) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTargets();

    return () => {
      mounted = false;
    };
  }, [projectId, clientId]);

  const updateTargets = async (newTargets: Partial<PerformanceTargets>) => {
    try {
      setError(null);
      const result = await performanceTargetsService.saveUserTargets(
        newTargets,
        projectId,
        clientId,
      );
      setTargets(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        !errorMessage.includes("user_performance_targets") &&
        !errorMessage.includes("PGRST116") &&
        !errorMessage.includes("PGRST301") &&
        !errorMessage.includes("42P01")
      ) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
      throw err;
    }
  };

  return {
    targets,
    loading,
    error,
    updateTargets,
  };
};
