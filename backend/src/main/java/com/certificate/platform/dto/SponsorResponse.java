package com.certificate.platform.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SponsorResponse {

    private Long id;
    private String name;
    private String tagline;
    private String brandColor;
    private String logoUrl;
    private String websiteUrl;
    private String bannerImageUrl;
    private BigDecimal budget;
    private BigDecimal spentAmount;
    private BigDecimal cpmRate;
    private Long totalImpressions;
    private Long totalClicks;
    private String targetCategory;
    private String sponsorType;
    private Integer slotNumber;
    private Long createdById;
    private String createdByName;
    private String status;
    private Boolean isActive;
    private LocalDateTime campaignStart;
    private LocalDateTime campaignEnd;
    private LocalDateTime createdAt;
}
