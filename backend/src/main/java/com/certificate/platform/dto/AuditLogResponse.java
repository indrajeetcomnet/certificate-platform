package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private Long userId;
    private String username;
    private String eventType;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;
}
