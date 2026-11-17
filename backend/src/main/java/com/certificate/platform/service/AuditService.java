package com.certificate.platform.service;

import com.certificate.platform.dto.AuditLogResponse;
import com.certificate.platform.model.AuditLog;
import com.certificate.platform.model.User;
import com.certificate.platform.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog logEvent(User user, String eventType, String details, String ipAddress) {
        if (eventType == null || eventType.trim().isEmpty()) {
            throw new IllegalArgumentException("Audit log eventType cannot be null or blank");
        }
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .eventType(eventType)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        return auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByUser(Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByEventType(String eventType) {
        return auditLogRepository.findByEventTypeOrderByCreatedAtDesc(eventType).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .username(log.getUser() != null ? log.getUser().getUsername() : "ANONYMOUS")
                .eventType(log.getEventType())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
