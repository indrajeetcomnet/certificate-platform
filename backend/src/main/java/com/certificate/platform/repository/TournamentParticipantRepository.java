package com.certificate.platform.repository;

import com.certificate.platform.model.TournamentParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, Long> {
    List<TournamentParticipant> findByTournamentIdOrderByCreatedAtAsc(Long tournamentId);
    Optional<TournamentParticipant> findByTournamentIdAndUserId(Long tournamentId, Long userId);
    long countByTournamentId(Long tournamentId);
}
