import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as dataService from '../api/dataService';
import { PAGINATION_DEFAULTS } from '../config';

/**
 * Custom hook for fetching defects with infinite scrolling.
 *
 * This hook is designed for use with a virtualized table, where new pages of
 * data are fetched as the user scrolls. It uses TanStack Query's `useInfiniteQuery`.
 *
 * @param {object} filters - The filters to apply to the query (e.g., { severity: 'High' }).
 * @returns {object} The state and methods from `useInfiniteQuery`.
 */
export function useDefects(filters) {
  return useInfiniteQuery({
    queryKey: ['defects', filters],
    queryFn: ({ pageParam = 1 }) => dataService.getDefects({
      ...filters,
      page: pageParam,
    }),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.has_more) return undefined;
      return pages.length + 1;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom hook for fetching defects with standard pagination.
 *
 * This hook is used for a traditional paginated table, fetching one page at a time.
 * It uses TanStack Query's `useQuery`.
 *
 * @param {object} filters - The filters to apply to the query.
 * @param {number} page - The current page number.
 * @returns {object} The state and methods from `useQuery`.
 */
export function useDefectsPaginated(filters, page = PAGINATION_DEFAULTS.PAGE) {
  return useQuery({
    queryKey: ['defects', filters, page],
    queryFn: () => dataService.getDefects({
      ...filters,
      page,
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom hook for searching aircraft registrations.
 *
 * @param {string} searchTerm - The search term.
 * @returns {object} The state and methods from `useQuery`.
 */
export function useAircraftSearch(searchTerm) {
    return useQuery({
        queryKey: ['aircraft', 'search', searchTerm],
        queryFn: () => dataService.searchAircraft(searchTerm),
        enabled: !!searchTerm && searchTerm.length >= 2, // Only run query if search term is valid
        staleTime: 60 * 60 * 1000, // 1 hour, as aircraft list doesn't change often
        refetchOnWindowFocus: false,
    });
} 