package com.certificate.platform.security;

import com.certificate.platform.model.Session;
import com.certificate.platform.model.User;
import com.certificate.platform.repository.UserRepository;
import com.certificate.platform.service.AuditService;
import com.certificate.platform.service.SessionService;
import com.certificate.platform.util.TokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final SessionService sessionService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public AuthInterceptor(SessionService sessionService, UserRepository userRepository, AuditService auditService) {
        this.sessionService = sessionService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1. Skip CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();

        boolean isInstitutionalRoute = isInstitutionalEndpoint(method, path);
        boolean isAuthenticatedRoute = isAuthenticatedEndpoint(method, path);

        String authHeader = request.getHeader("Authorization");
        String token = extractBearerToken(authHeader);

        // If neither institutional nor authenticated, it is a public endpoint
        if (!isInstitutionalRoute && !isAuthenticatedRoute) {
            // Optional: attach user context if valid token provided
            if (token != null) {
                attachUserContextIfValid(request, token);
            }
            return true;
        }

        // 2. Authentication required
        if (token == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return false;
        }

        boolean hasActiveSession = (sessionService != null && sessionService.isSessionActive(token));
        boolean isTokenValid = TokenProvider.isValid(token);

        if (!isTokenValid && !hasActiveSession) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Token is invalid or expired");
            return false;
        }

        Long parsedUserId = TokenProvider.getUserId(token);
        if (parsedUserId == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid user ID in token payload");
            return false;
        }

        if (sessionService != null && !hasActiveSession) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Session is inactive or has been invalidated");
            return false;
        }

        User user = resolveUser(token);
        if (user == null) {
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "User account not found");
            return false;
        }

        // Store user in request attributes
        request.setAttribute("currentUser", user);
        request.setAttribute("currentUserId", user.getId());
        request.setAttribute("currentUserRole", user.getRole().name());

        // 3. Institutional role enforcement
        if (isInstitutionalRoute) {
            String tokenRole = TokenProvider.getRole(token);
            if (user.getRole() != User.Role.INSTITUTION || !"INSTITUTION".equals(tokenRole)) {
                String clientIp = getClientIp(request);
                if (auditService != null) {
                    auditService.logEvent(
                            user,
                            "SECURITY_DENIED",
                            "Access denied: User '" + user.getUsername() + "' (" + user.getRole() + ") attempted institutional operation " + method + " " + path,
                            clientIp
                    );
                }
                sendErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "Access denied. Requires INSTITUTION role.");
                return false;
            }
        }

        return true;
    }

    private boolean isInstitutionalEndpoint(String method, String path) {
        // Public verification is explicitly exempt
        if (path.startsWith("/api/v1/certificates/verify")) {
            return false;
        }

        // Institutional write endpoints:
        // POST /api/v1/badges
        // POST /api/v1/badges/assign
        // POST /api/v1/certificates/**
        // POST /api/v1/sponsors/**
        // PUT / DELETE on badges, sponsors, certificates
        if ("POST".equals(method)) {
            if (path.equals("/api/v1/badges")
                    || path.equals("/api/v1/badges/assign")
                    || path.startsWith("/api/v1/certificates")
                    || path.startsWith("/api/v1/sponsors")
                    || (path.startsWith("/api/v1/tournaments") && !path.contains("/participants"))) {
                return true;
            }
        }
        if ("PUT".equals(method) || "DELETE".equals(method)) {
            if (path.startsWith("/api/v1/badges")
                    || path.startsWith("/api/v1/certificates")
                    || path.startsWith("/api/v1/sponsors")
                    || path.startsWith("/api/v1/tournaments")) {
                return true;
            }
        }
        return false;
    }

    private boolean isAuthenticatedEndpoint(String method, String path) {
        // Explicitly public routes
        if (path.startsWith("/api/v1/certificates/verify")) {
            return false;
        }

        // Authenticated routes (any active authenticated user):
        // /api/v1/auth/logout, /api/v1/auth/me
        // /api/v1/audit/**
        // /api/v1/messages/**
        // /api/v1/views/earnings/**
        if (path.equals("/api/v1/auth/logout")
                || path.equals("/api/v1/auth/me")
                || path.startsWith("/api/v1/audit")
                || path.startsWith("/api/v1/messages")
                || path.startsWith("/api/v1/views/earnings")) {
            return true;
        }

        // User profile modifications
        if (path.startsWith("/api/v1/users") && ("PUT".equals(method) || "POST".equals(method) || "DELETE".equals(method))) {
            return true;
        }

        // Post mutations
        if ("POST".equals(method) && path.startsWith("/api/v1/posts")) {
            return true;
        }
        if ("DELETE".equals(method) && path.startsWith("/api/v1/posts")) {
            return true;
        }

        // View recording
        if ("POST".equals(method) && path.equals("/api/v1/views/record")) {
            return true;
        }

        // Tournament operations (viewing tournaments, participant registration)
        if (path.startsWith("/api/v1/tournaments")) {
            return true;
        }

        return false;
    }

    private String extractBearerToken(String authHeader) {
        if (authHeader != null && authHeader.trim().startsWith("Bearer ")) {
            String token = authHeader.trim().substring(7).trim();
            if (!token.isEmpty()) {
                return token;
            }
        }
        return null;
    }

    private User resolveUser(String token) {
        Long userId = TokenProvider.getUserId(token);
        if (userId != null && userRepository != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                return userOpt.get();
            }
        }
        if (sessionService != null) {
            Optional<Session> sessionOpt = sessionService.getSession(token);
            if (sessionOpt.isPresent() && sessionOpt.get().getUser() != null) {
                return sessionOpt.get().getUser();
            }
        }
        return null;
    }

    private void attachUserContextIfValid(HttpServletRequest request, String token) {
        try {
            if (TokenProvider.isValid(token)) {
                User user = resolveUser(token);
                if (user != null) {
                    request.setAttribute("currentUser", user);
                    request.setAttribute("currentUserId", user.getId());
                    request.setAttribute("currentUserRole", user.getRole().name());
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        String errorName = (status == HttpServletResponse.SC_FORBIDDEN) ? "Forbidden" : "Unauthorized";
        String json = String.format("{\"error\": \"%s\", \"message\": \"%s\", \"status\": %d}", errorName, message, status);
        response.getWriter().write(json);
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
