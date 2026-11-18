package com.certificate.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BulkAssignBadgeRequest {

    @NotNull(message = "Badge ID is required")
    private Long badgeId;

    private List<Long> userIds;
    private List<String> usernames;
    private List<String> emails;

    private Long institutionId;
}
