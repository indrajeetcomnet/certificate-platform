package com.certificate.platform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sponsors")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Sponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String logoUrl;

    private String websiteUrl;

    private String bannerImageUrl;

    private String tagline;

    @Builder.Default
    private String brandColor = "#E11D48";

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal budget = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal cpmRate = new BigDecimal("20.00");

    @Builder.Default
    private Long totalImpressions = 0L;

    @Builder.Default
    private Long totalClicks = 0L;

    @Builder.Default
    private String targetCategory = "ALL";

    @Builder.Default
    private String sponsorType = "BRAND";

    private Long createdById;

    private String createdByName;

    @Builder.Default
    private String status = "ACTIVE";

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime campaignStart;

    private LocalDateTime campaignEnd;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
