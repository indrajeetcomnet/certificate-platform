package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserBadgeResponse {

    private Long id;
    private BadgeResponse badge;
    private LocalDateTime awardedAt;
    private String awardedByInstitutionName;
}
