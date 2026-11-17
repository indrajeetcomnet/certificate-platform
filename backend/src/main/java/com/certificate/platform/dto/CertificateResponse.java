package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CertificateResponse {

    private Long id;
    private String uniqueCode;
    private String title;
    private String description;
    private String recipientName;
    private String recipientEmail;
    private String institutionName;
    private Long institutionId;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String templateData;
    private Boolean verified;
    private LocalDateTime createdAt;
}
