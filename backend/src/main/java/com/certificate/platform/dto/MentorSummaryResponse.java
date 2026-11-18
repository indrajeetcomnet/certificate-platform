package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MentorSummaryResponse {

    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String roleTitle;
    private LocalDateTime creditedAt;
}
