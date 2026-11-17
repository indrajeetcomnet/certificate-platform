package com.certificate.platform.repository;

import com.certificate.platform.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByInstitutionIdOrderByCreatedAtDesc(Long institutionId);
    List<Tournament> findAllByOrderByCreatedAtDesc();
}
