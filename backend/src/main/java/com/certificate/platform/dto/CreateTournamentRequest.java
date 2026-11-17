package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateTournamentRequest {

    @NotBlank(message = "Tournament title is required")
    private String title;

    private String description;

    @NotBlank(message = "Sport category is required")
    private String sport;

    @NotBlank(message = "Tournament format is required")
    private String format;

    private String venue;
    private String startDate;
    private String endDate;
    private String registrationDeadline;
    private Integer maxParticipants;

    /**
     * Google-Forms-style JSON string for custom question fields.
     */
    private String customFormSchema;

    private Long linkedBadgeGoldId;
    private Long linkedBadgeSilverId;
    private Long linkedBadgeBronzeId;
    private String linkedCertificateTemplate;
}
