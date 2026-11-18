package com.certificate.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssignBadgeRequest {

    // Can identify user by numeric ID, username, or email
    private Long userId;

    private String username;

    private String userEmail;

    @NotNull(message = "Badge ID is required")
    private Long badgeId;

    private Long institutionId;
}
