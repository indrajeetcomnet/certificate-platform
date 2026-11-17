import { useEffect, useRef, useCallback } from 'react';
import { recordView } from '../api/viewsApi';

/**
 * Hook to track visibility of a sponsor badge element.
 * Uses IntersectionObserver to detect when the element enters the viewport,
 * then records the view duration when it leaves.
 *
 * @param {object} options
 * @param {number} options.sponsorId - The sponsor ID to track.
 * @param {number|null} options.postId - Optional associated post ID.
 * @param {number} options.threshold - Intersection threshold (0-1). Default 0.5.
 * @returns {React.RefObject} ref - Attach to the DOM element to observe.
 */
export default function useViewTracking({ sponsorId, postId = null, threshold = 0.5 } = {}) {
  const elementRef = useRef(null);
  const visibleSinceRef = useRef(null);

  const sendViewEvent = useCallback(
    (durationMs) => {
      if (!sponsorId || durationMs < 100) return;

      recordView({
        sponsorId,
        postId,
        viewType: 'SPONSOR_BADGE',
        durationMs: Math.round(durationMs),
      }).catch((err) => {
        console.error('[ViewTracking] Failed to record view:', err);
      });
    },
    [sponsorId, postId]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !sponsorId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSinceRef.current = Date.now();
          } else if (visibleSinceRef.current) {
            const duration = Date.now() - visibleSinceRef.current;
            sendViewEvent(duration);
            visibleSinceRef.current = null;
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      // Record any in-progress view on cleanup
      if (visibleSinceRef.current) {
        const duration = Date.now() - visibleSinceRef.current;
        sendViewEvent(duration);
        visibleSinceRef.current = null;
      }
      observer.disconnect();
    };
  }, [sponsorId, threshold, sendViewEvent]);

  return elementRef;
}
