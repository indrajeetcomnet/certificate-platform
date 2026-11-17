package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TournamentResponse {
    private Long id;
    private String title;
    private String description;
    private String sport;
    private String format;
    private String venue;
    private String startDate;
    private String endDate;
    private String registrationDeadline;
    private String status;
    private Integer maxParticipants;
    private Long institutionId;
    private String institutionName;
    private String customFormSchema;
    private Long linkedBadgeGoldId;
    private String linkedBadgeGoldName;
    private Long linkedBadgeSilverId;
    private String linkedBadgeSilverName;
    private Long linkedBadgeBronzeId;
    private String linkedBadgeBronzeName;
    private String linkedCertificateTemplate;
    private String winner1stName;
    private String winner2ndName;
    private String winner3rdName;
    private long participantCount;
    private List<TournamentParticipantResponse> participants;
    private List<TournamentMatchResponse> matches;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
