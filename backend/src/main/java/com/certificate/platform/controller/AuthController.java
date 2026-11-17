package com.certificate.platform.controller;

import com.certificate.platform.dto.AuthResponse;
import com.certificate.platform.dto.InstitutionLoginRequest;
import com.certificate.platform.dto.LoginRequest;
import com.certificate.platform.dto.RegisterRequest;
import com.certificate.platform.model.Session;
import com.certificate.platform.model.User;
import com.certificate.platform.service.AuditService;
import com.certificate.platform.service.AuthService;
import com.certificate.platform.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final AuditService auditService;

    public AuthController(AuthService authService) {
        this(authService, null, null);
    }

    @Autowired
    public AuthController(AuthService authService,
                          @Autowired(required = false) SessionService sessionService,
                          @Autowired(required = false) AuditService auditService) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/institution-login")
    public ResponseEntity<AuthResponse> institutionLogin(@Valid @RequestBody InstitutionLoginRequest request) {
        AuthResponse response = authService.loginInstitution(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentSession(HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");
        if (user == null) {
            Map<String, Object> unauth = new LinkedHashMap<>();
            unauth.put("authenticated", false);
            unauth.put("message", "No active session found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(unauth);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", true);
        body.put("userId", user.getId());
        body.put("username", user.getUsername());
        body.put("displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
        body.put("email", user.getEmail());
        body.put("avatarUrl", user.getAvatarUrl());
        body.put("role", user.getRole().name());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }

        if (token != null && !token.isBlank()) {
            User user = null;
            if (sessionService != null) {
                Optional<Session> sessionOpt = sessionService.getSession(token);
                if (sessionOpt.isPresent()) {
                    user = sessionOpt.get().getUser();
                }
                sessionService.invalidateSession(token);
            }
            if (auditService != null) {
                String ipAddress = request != null ? request.getRemoteAddr() : null;
                auditService.logEvent(user, "LOGOUT", "User logged out successfully and session terminated", ipAddress);
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("message", "Logged out successfully");
        return ResponseEntity.ok(body);
    }
}
