import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDefects, fetchAnalytics } from '../api/defectApi';

// Custom hook for fetching defects with infinite scrolling (for virtualized table).
export function useDefects(filters) {
  return useInfiniteQuery({
    queryKey: ['defects', filters],
    queryFn: ({ pageParam = 1 }) => 
      fetchDefects({ 
        ...filters, 
        page: pageParam, 
        page_size: 50 
      }),
    // This function is the core of infinite scrolling.
    // It tells TanStack Query how to get the next page's data.
    getNextPageParam: (lastPage) => 
      lastPage.has_more ? lastPage.page + 1 : undefined,
    // Cache data for 5 minutes to make subsequent navigations feel instant.
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Custom hook for fetching defects with standard pagination.
export function useDefectsPaginated(filters, page = 1) {
  return useQuery({
    queryKey: ['defects', 'paginated', filters, page],
    queryFn: () => fetchDefects({ 
      ...filters, 
      page, 
      page_size: 50 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    // UX enhancement: keeps previous data on screen while fetching new page.
    // This prevents a jarring loading state on page change.
    keepPreviousData: true,
  });
}

export function useAnalytics() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for analytics
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Expose a manual refresh function by invalidating the query cache.
  // This gives the user control over data freshness.
  const refreshAnalytics = () => {
    queryClient.invalidateQueries(['analytics']);
  };

  return {
    ...query,
    refreshAnalytics
  };
} 