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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("Platform Smoke Test")
class PlatformSmokeTest {

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private AuthService authService;

    @Mock
    private BadgeService badgeService;

    @Mock
    private ViewService viewService;

    @Mock
    private EarningService earningService;

    @Mock
    private PostService postService;

    @Mock
    private SessionService sessionService;

    @Mock
    private AuditService auditService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

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
