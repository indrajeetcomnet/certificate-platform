package com.certificate.platform.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mentor_credits", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"athlete_id", "mentor_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MentorCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "athlete_id", nullable = false)
    private User athlete;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Builder.Default
    private String roleTitle = "Coach / Mentor";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
