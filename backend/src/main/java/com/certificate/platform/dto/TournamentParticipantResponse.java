package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TournamentParticipantResponse {
    private Long id;
    private Long tournamentId;
    private Long userId;
    private String athleteName;
    private String teamName;
    private Integer seedNumber;
    private String captainName;
    private String email;
    private String phone;
    private String status;
    private String formResponses;
    private String avatarUrl;
    private LocalDateTime createdAt;
}
