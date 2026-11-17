package com.certificate.platform;

import com.certificate.platform.repository.UserRepository;
import com.certificate.platform.repository.BadgeRepository;
import com.certificate.platform.repository.SessionRepository;
import com.certificate.platform.repository.AuditLogRepository;
import com.certificate.platform.service.AuthService;
import com.certificate.platform.service.BadgeService;
import com.certificate.platform.service.EarningService;
import com.certificate.platform.service.PostService;
import com.certificate.platform.service.SessionService;
import com.certificate.platform.service.AuditService;
import com.certificate.platform.service.ViewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@DisplayName("Platform Smoke Test")
class PlatformSmokeTest {

    static {
        System.setProperty("org.springframework.boot.logging.LoggingSystem", "none");
    }

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private AuthService authService;

    @Autowired(required = false)
    private BadgeService badgeService;

    @Autowired(required = false)
    private ViewService viewService;

    @Autowired(required = false)
    private EarningService earningService;

    @Autowired(required = false)
    private PostService postService;

    @Autowired(required = false)
    private SessionService sessionService;

    @Autowired(required = false)
    private AuditService auditService;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private BadgeRepository badgeRepository;

    @Autowired(required = false)
    private SessionRepository sessionRepository;

    @Autowired(required = false)
    private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("should verify Spring application context loads successfully")
    void shouldVerifyApplicationContextLoads() {
        assertThat(applicationContext).isNotNull();
    }

    @Test
    @DisplayName("should verify core domain services and repositories are injected and functional")
    void shouldVerifyCoreBeansPresentAndActive() {
        assertThat(authService).as("AuthService must be registered").isNotNull();
        assertThat(badgeService).as("BadgeService must be registered").isNotNull();
        assertThat(viewService).as("ViewService must be registered").isNotNull();
        assertThat(earningService).as("EarningService must be registered").isNotNull();
        assertThat(postService).as("PostService must be registered").isNotNull();
        assertThat(sessionService).as("SessionService must be registered").isNotNull();
        assertThat(auditService).as("AuditService must be registered").isNotNull();
        assertThat(userRepository).as("UserRepository must be registered").isNotNull();
        assertThat(badgeRepository).as("BadgeRepository must be registered").isNotNull();
        assertThat(sessionRepository).as("SessionRepository must be registered").isNotNull();
        assertThat(auditLogRepository).as("AuditLogRepository must be registered").isNotNull();
    }
}
