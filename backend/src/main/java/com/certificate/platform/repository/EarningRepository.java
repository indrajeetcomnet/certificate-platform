package com.certificate.platform.repository;

import com.certificate.platform.model.Earning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EarningRepository extends JpaRepository<Earning, Long> {
    List<Earning> findByUserIdOrderByCalculatedAtDesc(Long userId);
    Optional<Earning> findByUserIdAndPeriod(Long userId, String period);
    List<Earning> findByUserIdAndPeriodOrderByCalculatedAtDesc(Long userId, String period);
}
