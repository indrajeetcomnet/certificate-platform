package com.certificate.platform.security;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * High-performance sliding window rate limiter.
 * Tracks timestamps within a continuous sliding window to prevent burst attacks,
 * credential stuffing, brute force logins, and API resource exhaustion.
 */
@Component
public class SlidingWindowRateLimiter {

    public static class RateLimitResult {
        private final boolean allowed;
        private final int limit;
        private final int remaining;
        private final long resetEpochSeconds;
        private final long retryAfterSeconds;

        public RateLimitResult(boolean allowed, int limit, int remaining, long resetEpochSeconds, long retryAfterSeconds) {
            this.allowed = allowed;
            this.limit = limit;
            this.remaining = remaining;
            this.resetEpochSeconds = resetEpochSeconds;
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public int getLimit() {
            return limit;
        }

        public int getRemaining() {
            return remaining;
        }

        public long getResetEpochSeconds() {
            return resetEpochSeconds;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }

    private static class ClientBucket {
        private final Deque<Long> timestamps = new ArrayDeque<>();
    }

    private final Map<String, ClientBucket> buckets = new ConcurrentHashMap<>();

    public SlidingWindowRateLimiter() {
        ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rate-limit-cleaner");
            t.setDaemon(true);
            return t;
        });
        cleaner.scheduleAtFixedRate(this::pruneExpiredBuckets, 5, 5, TimeUnit.MINUTES);
    }

    /**
     * Attempts to acquire an execution permit within the sliding time window.
     *
     * @param key Unique client identifier (e.g. "IP:AUTH" or "USER:POST")
     * @param maxRequests Maximum allowed requests in the sliding window
     * @param windowDurationMillis Duration of the sliding window in milliseconds
     * @return RateLimitResult containing permit status and rate limit headers
     */
    public RateLimitResult tryAcquire(String key, int maxRequests, long windowDurationMillis) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowDurationMillis;

        ClientBucket bucket = buckets.computeIfAbsent(key, k -> new ClientBucket());
        synchronized (bucket) {
            Deque<Long> ts = bucket.timestamps;

            // Evict timestamps older than the sliding window start
            while (!ts.isEmpty() && ts.peekFirst() <= windowStart) {
                ts.pollFirst();
            }

            int currentCount = ts.size();
            long oldestTimestamp = ts.isEmpty() ? now : ts.peekFirst();
            long resetEpochSeconds = (oldestTimestamp + windowDurationMillis + 999) / 1000;
            long retryAfterSeconds = Math.max(1, (oldestTimestamp + windowDurationMillis - now + 999) / 1000);

            if (currentCount < maxRequests) {
                ts.addLast(now);
                int remaining = Math.max(0, maxRequests - currentCount - 1);
                return new RateLimitResult(true, maxRequests, remaining, resetEpochSeconds, 0);
            } else {
                return new RateLimitResult(false, maxRequests, 0, resetEpochSeconds, retryAfterSeconds);
            }
        }
    }

    private void pruneExpiredBuckets() {
        long now = System.currentTimeMillis();
        long maxIdleTime = 600_000L; // 10 minutes
        buckets.entrySet().removeIf(entry -> {
            ClientBucket b = entry.getValue();
            synchronized (b) {
                return b.timestamps.isEmpty() || (now - b.timestamps.peekLast() > maxIdleTime);
            }
        });
    }
}
