package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateSponsorRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String tagline;
    private String logoUrl;
    private String websiteUrl;
    private String bannerImageUrl;
    private BigDecimal budget;
    private BigDecimal cpmRate;
    private String targetCategory;
    private String sponsorType;
    private Long targetBadgeId;
    private Boolean isActive;
    private LocalDateTime campaignStart;
    private LocalDateTime campaignEnd;
}
