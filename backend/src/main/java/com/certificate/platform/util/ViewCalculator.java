package com.certificate.platform.util;

import com.certificate.platform.model.ViewEvent;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implements the view-counting algorithm:
 * - Only count views with durationMs >= 2000 (2-second minimum)
 * - Filter duplicate views from the same sessionId / ipHash within 30 seconds
 * - Count unique views within time windows
 * - Rate: 20 INR per 1000 qualifying views (₹20.00 / 1000)
 */
public class ViewCalculator {

    public static final long MIN_DURATION_MS = 2000;
    public static final long DUPLICATE_WINDOW_SECONDS = 30;
    public static final BigDecimal RATE_PER_THOUSAND = new BigDecimal("20.00");

    /**
     * Filters and counts qualifying views from a list of view events.
     * Qualifying criteria:
     *  1. durationMs >= 2000
     *  2. No duplicate views from same sessionId or ipHash within 30 seconds
     */
    public static long countQualifyingViews(List<ViewEvent> viewEvents) {
        if (viewEvents == null || viewEvents.isEmpty()) {
            return 0;
        }

        // Filter by minimum duration (>= 2000ms)
        List<ViewEvent> durationFiltered = viewEvents.stream()
                .filter(v -> v.getDurationMs() != null && v.getDurationMs() >= MIN_DURATION_MS)
                .sorted(Comparator.comparing(v -> v.getViewedAt() != null ? v.getViewedAt() : java.time.LocalDateTime.MIN))
                .collect(Collectors.toList());

        // Deduplicate by sessionId / ipHash within 30-second windows
        Map<String, ViewEvent> lastSeenByKey = new HashMap<>();
        long qualifyingCount = 0;

        for (ViewEvent event : durationFiltered) {
            String key = null;
            if (event.getSessionId() != null && !event.getSessionId().trim().isEmpty()) {
                key = "session:" + event.getSessionId().trim();
            } else if (event.getIpHash() != null && !event.getIpHash().trim().isEmpty()) {
                key = "ip:" + event.getIpHash().trim();
            }

            if (key == null) {
                // Anonymous views without identifier count
                qualifyingCount++;
                continue;
            }

            ViewEvent lastSeen = lastSeenByKey.get(key);
            if (lastSeen == null) {
                qualifyingCount++;
                lastSeenByKey.put(key, event);
            } else {
                Duration gap = Duration.between(lastSeen.getViewedAt(), event.getViewedAt());
                if (gap.abs().getSeconds() >= DUPLICATE_WINDOW_SECONDS) {
                    qualifyingCount++;
                    lastSeenByKey.put(key, event);
                }
                // else: duplicate within window, skip
            }
        }

        return qualifyingCount;
    }

    /**
     * Calculates earnings based on qualifying views.
     * Formula: (qualifyingViews / 1000) * 20.00 in INR
     */
    public static BigDecimal calculateEarnings(long qualifyingViews) {
        if (qualifyingViews <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(qualifyingViews)
                .divide(new BigDecimal("1000"), 10, RoundingMode.HALF_UP)
                .multiply(RATE_PER_THOUSAND)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
