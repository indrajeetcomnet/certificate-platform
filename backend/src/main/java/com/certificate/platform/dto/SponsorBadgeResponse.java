package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SponsorBadgeResponse {

    private Long id;
    private Long sponsorId;
    private String sponsorName;
    private String sponsorLogoUrl;
    private String brandColor;
    private String sponsorBannerImageUrl;
    private String sponsorWebsiteUrl;
    private Integer priority;
    private Long badgeId;
    private String badgeName;
}
