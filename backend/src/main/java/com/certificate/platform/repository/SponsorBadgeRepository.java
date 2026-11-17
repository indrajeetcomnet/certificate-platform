package com.certificate.platform.repository;

import com.certificate.platform.model.SponsorBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SponsorBadgeRepository extends JpaRepository<SponsorBadge, Long> {
    List<SponsorBadge> findByBadgeIdAndIsActiveTrue(Long badgeId);
    List<SponsorBadge> findBySponsorIdAndIsActiveTrue(Long sponsorId);
}
