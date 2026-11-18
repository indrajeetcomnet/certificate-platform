package com.certificate.platform.dto;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BulkAssignBadgeResponse {
    private Long badgeId;
    private String badgeName;
    private int assignedCount;
    private int skippedCount;
    private List<String> assignedUsers;
    private List<String> notFoundIdentifiers;
}
