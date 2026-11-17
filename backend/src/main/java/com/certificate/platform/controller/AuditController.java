package com.certificate.platform.controller;

import com.certificate.platform.dto.AuditLogResponse;
import com.certificate.platform.exception.AccessDeniedException;
import com.certificate.platform.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLogResponse>> getLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Long userId,
            HttpServletRequest request) {
        Long authenticatedId = (request != null && request.getAttribute("currentUserId") instanceof Long)
                ? (Long) request.getAttribute("currentUserId")
                : null;
        String role = (request != null && request.getAttribute("currentUserRole") instanceof String)
                ? (String) request.getAttribute("currentUserRole")
                : null;

        // Regular users may only inspect their own audit logs
        if (!"ADMIN".equalsIgnoreCase(role) && !"INSTITUTION".equalsIgnoreCase(role)) {
            if (userId != null && !userId.equals(authenticatedId)) {
                throw new AccessDeniedException("Access denied: You can only inspect your own audit logs");
            }
            // If no userId specified, force it to the authenticated user's ID
            userId = authenticatedId;
        }

        List<AuditLogResponse> logs;
        if (userId != null) {
            logs = auditService.getLogsByUser(userId);
        } else if (eventType != null && !eventType.isBlank()) {
            logs = auditService.getLogsByEventType(eventType.trim());
        } else {
            logs = auditService.getLogs();
        }
        return ResponseEntity.ok(logs);
    }
}
