package com.certificate.platform.dto;

import com.certificate.platform.model.ViewEvent;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ViewEventRequest {

    private Long sponsorId;

    private Long postId;

    @NotNull(message = "View type is required")
    private ViewEvent.ViewType viewType;

    @NotNull(message = "Duration is required")
    private Long durationMs;

    private Long userId;
    private String sessionId;
    private String ipHash;
}
