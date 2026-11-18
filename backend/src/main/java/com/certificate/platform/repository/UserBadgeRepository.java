package com.certificate.platform.repository;

import com.certificate.platform.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserId(Long userId);
    List<UserBadge> findByUserIdIn(List<Long> userIds);
    List<UserBadge> findByBadgeId(Long badgeId);
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
    Optional<UserBadge> findByUserIdAndBadgeId(Long userId, Long badgeId);
    void deleteByUserIdAndBadgeId(Long userId, Long badgeId);
}
