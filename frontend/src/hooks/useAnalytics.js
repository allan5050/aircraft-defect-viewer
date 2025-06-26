import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as dataService from '../api/dataService';

/**
 * Custom hook for fetching analytics data.
 *
 * It uses TanStack Query to fetch, cache, and manage the state of the
 * analytics data. It also provides a manual refresh function.
 *
 * @returns {object} The state and methods from `useQuery`, plus a `refreshAnalytics` function.
 */
export function useAnalytics() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['analytics'],
    queryFn: dataService.getAnalytics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  /**
   * Manually refetches the analytics data by invalidating the query cache.
   */
  const refreshAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  return {
    ...query,
    refreshAnalytics
  };
} 