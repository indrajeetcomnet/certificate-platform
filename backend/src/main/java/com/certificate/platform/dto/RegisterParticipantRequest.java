package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RegisterParticipantRequest {

    private Long userId; // optional if already authenticated

    @NotBlank(message = "Athlete name is required")
    private String athleteName;

    private String email;
    private String phone;

    /**
     * JSON string with athlete's answers to the custom questions in the tournament's Google Form.
     */
    private String formResponses;
}
