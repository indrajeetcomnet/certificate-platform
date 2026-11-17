import { useState, useCallback } from 'react';

/**
 * Hook for managing paginated data fetching.
 *
 * @param {function} fetchFn - Async function that accepts a page number and returns
 *   a response with { data: { content: [], last: boolean } } (Spring Page format).
 * @param {object} options
 * @param {number} options.initialPage - Starting page number (default 0).
 * @returns {{ data, loading, error, page, hasMore, fetchNextPage, reset }}
 */
export default function usePagination(fetchFn, { initialPage = 0 } = {}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchNextPage = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(page);
      const result = response.data;

      const items = result.content || result;
      const isLast = result.last !== undefined ? result.last : items.length === 0;

      setData((prev) => (page === initialPage ? items : [...prev, ...items]));
      setHasMore(!isLast);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, loading, hasMore, initialPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setLoading(false);
    setError(null);
    setHasMore(true);
  }, [initialPage]);

  return { data, loading, error, page, hasMore, fetchNextPage, reset };
}
