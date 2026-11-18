package com.certificate.platform.repository;

import com.certificate.platform.model.MentorCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorCreditRepository extends JpaRepository<MentorCredit, Long> {

    List<MentorCredit> findByAthleteId(Long athleteId);

    List<MentorCredit> findByMentorId(Long mentorId);

    Optional<MentorCredit> findByAthleteIdAndMentorId(Long athleteId, Long mentorId);

    void deleteByAthleteIdAndMentorId(Long athleteId, Long mentorId);

    void deleteByAthleteId(Long athleteId);

    long countByMentorId(Long mentorId);
}
