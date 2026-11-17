package com.certificate.platform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_matches")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TournamentMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(nullable = false)
    private String roundName; // e.g. "Heat 1", "Quarter-Finals", "Semi-Finals", "Grand Final"

    private Integer matchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant1_id")
    private TournamentParticipant participant1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant2_id")
    private TournamentParticipant participant2;

    private String score1; // e.g. "10.18s" or "2"

    private String score2; // e.g. "10.45s" or "1"

    private Long winnerParticipantId;

    private String scheduledTime; // e.g. "10:30 AM"

    private String scheduledDate; // e.g. "2026-11-20"

    private String courtVenue; // e.g. "Track 4 - Lane 3 & 4"

    @Column(nullable = false)
    @Builder.Default
    private String status = "UPCOMING"; // UPCOMING, LIVE, COMPLETED

    @CreationTimestamp
    private LocalDateTime createdAt;
}
