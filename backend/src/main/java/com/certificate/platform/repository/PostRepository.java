package com.certificate.platform.repository;

import com.certificate.platform.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Post> findByParentPostId(Long parentPostId);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.viewsCount = COALESCE(p.viewsCount, 0) + 1 WHERE p.id = :postId")
    int incrementViewsCount(@Param("postId") Long postId);
}
