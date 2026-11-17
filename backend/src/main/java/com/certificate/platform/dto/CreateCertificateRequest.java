package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateCertificateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    private String recipientEmail;

    @NotNull(message = "Institution ID is required")
    private Long institutionId;

    private String templateData;

    private LocalDateTime expiresAt;

    private String uniqueCode;

    private String customPrefix;

    private String codeFormat;
}
