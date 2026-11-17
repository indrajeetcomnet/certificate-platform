package com.certificate.platform.repository;

import com.certificate.platform.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByToken(String token);

    Optional<Session> findByTokenAndIsActiveTrue(String token);

    List<Session> findByUserIdAndIsActiveTrue(Long userId);
}
