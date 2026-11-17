package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FinalizeTournamentRequest {
    private Long winner1stParticipantId;
    private Long winner2ndParticipantId;
    private Long winner3rdParticipantId;
    private Boolean awardCredentials; // Automatically award linked badges and certificates
}
