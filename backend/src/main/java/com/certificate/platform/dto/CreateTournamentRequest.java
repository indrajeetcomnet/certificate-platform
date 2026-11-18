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

    @Builder.Default
    private String category = "SPORTS"; // SPORTS, ESPORTS, ACADEMICS, ARTS, CORPORATE, OTHER

    @Builder.Default
    private String competitionType = "INDIVIDUAL"; // INDIVIDUAL, TEAM

    @Builder.Default
    private Integer teamSize = 1;

    @Builder.Default
    private String scoringType = "POINTS"; // POINTS, SETS, TIME, CUSTOM

    @Builder.Default
    private Boolean credentialsEnabled = true;

    @Builder.Default
    private Boolean isVirtual = false;

    private String status;

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
