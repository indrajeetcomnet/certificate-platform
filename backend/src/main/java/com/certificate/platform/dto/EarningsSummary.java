package com.certificate.platform.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EarningsSummary {

    private Long userId;
    private Long totalViews;
    private BigDecimal totalEarnings;
    private String period;
    private List<SponsorEarning> sponsorBreakdown;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class SponsorEarning {
        private Long sponsorId;
        private String sponsorName;
        private Long views;
        private BigDecimal amount;
    }
}
