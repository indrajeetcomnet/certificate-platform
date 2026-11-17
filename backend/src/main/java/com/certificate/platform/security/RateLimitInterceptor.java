package com.certificate.platform.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Enterprise Rate Limiting Interceptor implementing continuous sliding window counters.
 * Protects against credential attacks, spamming, denial-of-service, and scraping.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final SlidingWindowRateLimiter rateLimiter;

    // Rate limit tiers
    private static final int AUTH_LIMIT = 10;          // 10 requests / 60 seconds
    private static final int SENSITIVE_LIMIT = 30;     // 30 requests / 60 seconds
    private static final int WRITE_LIMIT = 45;         // 45 requests / 60 seconds
    private static final int GENERAL_LIMIT = 150;      // 150 requests / 60 seconds
    private static final long WINDOW_MS = 60_000L;     // 60 seconds sliding window

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();
        String clientIp = resolveClientIp(request);

        int limit;
        String category;

        if (path.startsWith("/api/v1/auth/login")
                || path.startsWith("/api/v1/auth/register")
                || path.startsWith("/api/v1/auth/institution-login")) {
            // Strict sliding window for login & registration to block credential stuffing & brute force
            limit = AUTH_LIMIT;
            category = "AUTH";
        } else if (path.startsWith("/api/v1/certificates/verify")) {
            // Limit verification endpoint to prevent code enumeration attacks
            limit = SENSITIVE_LIMIT;
            category = "VERIFY";
        } else if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method)) {
            // Write operations (creating posts, messages, certificates)
            limit = WRITE_LIMIT;
            category = "WRITE";
        } else {
            // General read endpoints
            limit = GENERAL_LIMIT;
            category = "DEFAULT";
        }

        String rateLimitKey = clientIp + ":" + category;
        SlidingWindowRateLimiter.RateLimitResult result = rateLimiter.tryAcquire(rateLimitKey, limit, WINDOW_MS);

        // Add standard rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetEpochSeconds()));

        if (!result.isAllowed()) {
            response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
            sendRateLimitExceeded(response, result.getRetryAfterSeconds());
            log.warn("Rate limit exceeded for IP {} on category {} (Path: {})", clientIp, category, path);
            return false;
        }

        return true;
    }

    private void sendRateLimitExceeded(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        String json = String.format(
                "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please wait %d seconds before retrying.\",\"status\":429,\"retryAfter\":%d}",
                retryAfterSeconds, retryAfterSeconds
        );
        response.getWriter().write(json);
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String candidate = xForwardedFor.split(",")[0].trim();
            if (isValidIp(candidate)) {
                return candidate;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && isValidIp(realIp.trim())) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private boolean isValidIp(String ip) {
        return ip != null && ip.matches("^[a-fA-F0-9:.]+$") && ip.length() <= 45;
    }
}
