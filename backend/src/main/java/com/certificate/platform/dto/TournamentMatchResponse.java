package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TournamentMatchResponse {
    private Long id;
    private Long tournamentId;
    private String roundName;
    private Integer matchNumber;
    private Long participant1Id;
    private String participant1Name;
    private String participant1Avatar;
    private Long participant2Id;
    private String participant2Name;
    private String participant2Avatar;
    private String score1;
    private String score2;
    private Long winnerParticipantId;
    private String winnerName;
    private String scheduledTime;
    private String scheduledDate;
    private String courtVenue;
    private String status;
    private LocalDateTime createdAt;
}
