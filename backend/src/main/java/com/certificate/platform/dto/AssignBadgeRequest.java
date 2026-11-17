package com.certificate.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssignBadgeRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Badge ID is required")
    private Long badgeId;

    private Long institutionId;
}
