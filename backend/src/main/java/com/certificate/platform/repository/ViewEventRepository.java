package com.certificate.platform.repository;

import com.certificate.platform.model.ViewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ViewEventRepository extends JpaRepository<ViewEvent, Long> {
    long countBySponsorIdAndViewedAtBetween(Long sponsorId, LocalDateTime start, LocalDateTime end);
    List<ViewEvent> findByUserIdAndSponsorId(Long userId, Long sponsorId);

    @Query("SELECT v FROM ViewEvent v WHERE v.sponsor.id = :sponsorId " +
           "AND v.viewedAt BETWEEN :start AND :end " +
           "AND v.durationMs >= 2000")
    List<ViewEvent> findQualifyingViews(
        @Param("sponsorId") Long sponsorId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("SELECT v FROM ViewEvent v WHERE (v.user.id = :userId OR (v.post IS NOT NULL AND v.post.user.id = :userId)) " +
           "AND v.sponsor.id = :sponsorId " +
           "AND v.viewedAt BETWEEN :start AND :end " +
           "AND v.durationMs >= 2000")
    List<ViewEvent> findQualifyingViewsByUser(
        @Param("userId") Long userId,
        @Param("sponsorId") Long sponsorId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("SELECT v FROM ViewEvent v WHERE (v.user.id = :userId OR (v.post IS NOT NULL AND v.post.user.id = :userId)) " +
           "AND v.sponsor.id = :sponsorId " +
           "AND v.durationMs >= 2000")
    List<ViewEvent> findAllQualifyingViewsByUserAndSponsor(
        @Param("userId") Long userId,
        @Param("sponsorId") Long sponsorId
    );

    @Query("SELECT v FROM ViewEvent v WHERE (v.user.id = :userId OR (v.post IS NOT NULL AND v.post.user.id = :userId)) " +
           "AND v.durationMs >= 2000")
    List<ViewEvent> findAllQualifyingViewsByUser(
        @Param("userId") Long userId
    );

    @Query("SELECT v FROM ViewEvent v WHERE v.post.id = :postId " +
           "AND v.viewedAt >= :since " +
           "AND (" +
           "  (:sessionId IS NOT NULL AND v.sessionId = :sessionId) OR " +
           "  (:userId IS NOT NULL AND v.user.id = :userId) OR " +
           "  (:ipHash IS NOT NULL AND v.ipHash = :ipHash)" +
           ")")
    List<ViewEvent> findRecentViewsForPost(
        @Param("postId") Long postId,
        @Param("since") LocalDateTime since,
        @Param("sessionId") String sessionId,
        @Param("userId") Long userId,
        @Param("ipHash") String ipHash
    );

    @Query("SELECT v FROM ViewEvent v WHERE v.sponsor.id = :sponsorId " +
           "AND v.viewedAt >= :since " +
           "AND (" +
           "  (:sessionId IS NOT NULL AND v.sessionId = :sessionId) OR " +
           "  (:userId IS NOT NULL AND v.user.id = :userId) OR " +
           "  (:ipHash IS NOT NULL AND v.ipHash = :ipHash)" +
           ")")
    List<ViewEvent> findRecentViewsForSponsor(
        @Param("sponsorId") Long sponsorId,
        @Param("since") LocalDateTime since,
        @Param("sessionId") String sessionId,
        @Param("userId") Long userId,
        @Param("ipHash") String ipHash
    );
}
