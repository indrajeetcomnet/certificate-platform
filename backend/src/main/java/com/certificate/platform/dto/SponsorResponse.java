package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SponsorResponse {

    private Long id;
    private String name;
    private String logoUrl;
    private String websiteUrl;
    private String bannerImageUrl;
    private Boolean isActive;
    private LocalDateTime campaignStart;
    private LocalDateTime campaignEnd;
    private LocalDateTime createdAt;
}
