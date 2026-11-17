package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateSponsorRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String logoUrl;
    private String websiteUrl;
    private String bannerImageUrl;
    private Boolean isActive;
    private LocalDateTime campaignStart;
    private LocalDateTime campaignEnd;
}
