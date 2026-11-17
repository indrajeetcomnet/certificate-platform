package com.certificate.platform.repository;

import com.certificate.platform.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByInstitutionId(Long institutionId);
    List<Badge> findByCategory(String category);
    Optional<Badge> findByRank(Integer rank);
}

