package com.certificate.platform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_participants")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TournamentParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String athleteName;

    private String teamName;

    private Integer seedNumber;

    private String captainName;

    private String email;

    private String phone;

    @Column(nullable = false)
    @Builder.Default
    private String status = "CONFIRMED"; // REGISTERED, CONFIRMED, DISQUALIFIED, PODIUM_1ST, PODIUM_2ND, PODIUM_3RD

    /**
     * JSON string storing athlete's custom answers corresponding to the tournament's customFormSchema.
     * E.g. {"bib_number":"402", "tshirt_size":"L", "age_category":"Senior Elite"}
     */
    @Column(columnDefinition = "TEXT")
    private String formResponses;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
