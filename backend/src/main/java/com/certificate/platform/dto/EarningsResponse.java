package com.certificate.platform.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EarningsResponse {

    private Long id;
    private Long userId;
    private Long sponsorId;
    private String sponsorName;
    private Long totalViews;
    private BigDecimal earnedAmount;
    private String period;
    private LocalDateTime calculatedAt;
}
