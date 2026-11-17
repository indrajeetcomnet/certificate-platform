package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UpdateMatchScoreRequest {
    private String score1;
    private String score2;
    private Long winnerParticipantId;
    private String status; // UPCOMING, LIVE, COMPLETED
    private String scheduledDate;
    private String scheduledTime;
    private String courtVenue;
}
