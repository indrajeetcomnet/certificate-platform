package com.certificate.platform.service;

import com.certificate.platform.model.Session;
import com.certificate.platform.model.User;
import com.certificate.platform.repository.SessionRepository;
import com.certificate.platform.repository.UserRepository;
import com.certificate.platform.util.TokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public SessionService(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public Session createSession(User user, String token, String userAgent, String ipAddress, Duration ttl) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = (ttl != null)
                ? now.plus(ttl)
                : now.plusSeconds(TokenProvider.getExpirationSeconds());

        Session session = Session.builder()
                .user(user)
                .token(token)
                .deviceInfo(userAgent)
                .ipAddress(ipAddress)
                .isActive(true)
                .createdAt(now)
                .lastActivityAt(now)
                .expiresAt(expiresAt)
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public Session createSession(User user, String token, String userAgent, String ipAddress) {
        return createSession(user, token, userAgent, ipAddress, Duration.ofSeconds(TokenProvider.getExpirationSeconds()));
    }

    @Transactional
    public void invalidateSession(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        Optional<Session> sessionOpt = sessionRepository.findByToken(token);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setIsActive(false);
            session.setLastActivityAt(LocalDateTime.now());
            sessionRepository.save(session);
        }
    }

    @Transactional
    public boolean isSessionActive(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Optional<Session> sessionOpt = sessionRepository.findByTokenAndIsActiveTrue(token);
        if (sessionOpt.isEmpty()) {
            return false;
        }
        Session session = sessionOpt.get();
        LocalDateTime now = LocalDateTime.now();
        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(now)) {
            session.setIsActive(false);
            sessionRepository.save(session);
            return false;
        }
        session.setLastActivityAt(now);
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<Session> getSession(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sessionRepository.findByToken(token);
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserBySessionToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sessionRepository.findByToken(token).map(Session::getUser);
    }

    @Transactional
    public void invalidateAllUserSessions(Long userId) {
        List<Session> sessions = sessionRepository.findByUserIdAndIsActiveTrue(userId);
        for (Session session : sessions) {
            session.setIsActive(false);
            session.setLastActivityAt(LocalDateTime.now());
        }
        sessionRepository.saveAll(sessions);
    }
}
