package com.certificate.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LinkBadgeRequest {

    @NotNull(message = "Badge ID is required")
    private Long badgeId;

    private Integer priority;
}
