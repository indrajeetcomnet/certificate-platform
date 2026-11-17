package com.certificate.platform.controller;

import com.certificate.platform.dto.EarningsSummary;
import com.certificate.platform.dto.ViewEventRequest;
import com.certificate.platform.dto.ViewEventResponse;
import com.certificate.platform.exception.AccessDeniedException;
import com.certificate.platform.service.EarningService;
import com.certificate.platform.service.ViewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/views")
@RequiredArgsConstructor
public class ViewsController {

    private final ViewService viewService;
    private final EarningService earningService;

    @PostMapping("/record")
    public ResponseEntity<ViewEventResponse> recordView(
            @Valid @RequestBody ViewEventRequest request,
            HttpServletRequest httpRequest) {
        Long authenticatedId = (httpRequest != null && httpRequest.getAttribute("currentUserId") instanceof Long)
                ? (Long) httpRequest.getAttribute("currentUserId")
                : null;
        if (authenticatedId != null) {
            request.setUserId(authenticatedId);
        }
        ViewEventResponse response = viewService.recordViewEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    public ResponseEntity<ViewEventResponse> recordView(ViewEventRequest request) {
        return recordView(request, null);
    }

    @GetMapping("/earnings/{userId}")
    public ResponseEntity<EarningsSummary> getEarningsSummary(
            @PathVariable Long userId,
            HttpServletRequest httpRequest) {
        enforceEarningsAccess(userId, httpRequest);
        return ResponseEntity.ok(earningService.getEarningsSummary(userId));
    }

    public ResponseEntity<EarningsSummary> getEarningsSummary(Long userId) {
        return getEarningsSummary(userId, null);
    }

    @GetMapping("/earnings/{userId}/{period}")
    public ResponseEntity<EarningsSummary> getPeriodEarnings(
            @PathVariable Long userId,
            @PathVariable String period,
            HttpServletRequest httpRequest) {
        enforceEarningsAccess(userId, httpRequest);
        return ResponseEntity.ok(earningService.calculateEarnings(userId, period));
    }

    public ResponseEntity<EarningsSummary> getPeriodEarnings(Long userId, String period) {
        return getPeriodEarnings(userId, period, null);
    }

    private void enforceEarningsAccess(Long targetUserId, HttpServletRequest request) {
        if (request == null) return;
        Long authenticatedId = (Long) request.getAttribute("currentUserId");
        String role = (String) request.getAttribute("currentUserRole");

        // Allow owner of earnings, institutions, or admins
        if (authenticatedId != null) {
            if (!authenticatedId.equals(targetUserId) && !"INSTITUTION".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
                throw new AccessDeniedException("Access denied: You cannot inspect another user's earnings");
            }
        }
    }
}
