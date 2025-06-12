import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDefects, fetchAnalytics } from '../api/defectApi';

export function useDefects(filters) {
  return useInfiniteQuery({
    queryKey: ['defects', filters],
    queryFn: ({ pageParam = 1 }) => 
      fetchDefects({ 
        ...filters, 
        page: pageParam, 
        page_size: 50 
      }),
    getNextPageParam: (lastPage) => 
      lastPage.has_more ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

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
    keepPreviousData: true, // Prevent loading states when changing pages
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

  // Add manual refresh capability
  const refreshAnalytics = () => {
    queryClient.invalidateQueries(['analytics']);
  };

  return {
    ...query,
    refreshAnalytics
  };
} 