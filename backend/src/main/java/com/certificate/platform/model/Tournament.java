package com.certificate.platform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournaments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String sport;

    @Column(nullable = false)
    private String format;

    private String venue;

    private String startDate;

    private String endDate;

    private String registrationDeadline;

    @Column(nullable = false)
    @Builder.Default
    private String status = "REGISTRATION_OPEN"; // DRAFT, REGISTRATION_OPEN, LIVE, COMPLETED

    private Integer maxParticipants;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    /**
     * Google-Forms-style JSON array defining customizable registration questions/fields.
     * E.g. [{"id":"bib","label":"Bib Number","type":"text","required":true}]
     */
    @Column(columnDefinition = "TEXT")
    private String customFormSchema;

    // Linked Badges
    private Long linkedBadgeGoldId;
    private Long linkedBadgeSilverId;
    private Long linkedBadgeBronzeId;

    // Linked Certificate Template
    private String linkedCertificateTemplate;

    // Recorded Winners (filled upon tournament completion)
    private String winner1stName;
    private String winner2ndName;
    private String winner3rdName;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
