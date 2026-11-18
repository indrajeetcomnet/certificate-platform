package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RegisterParticipantRequest {

    private Long userId; // optional if already authenticated

    @NotBlank(message = "Athlete or team name is required")
    private String athleteName;

    private String teamName;
    private Integer seedNumber;
    private String captainName;
    private String email;
    private String phone;

    /**
     * JSON string with answers to custom registration questions.
     */
    private String formResponses;
}
