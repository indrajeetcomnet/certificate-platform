package com.certificate.platform;

import com.certificate.platform.controller.BadgeController;
import com.certificate.platform.controller.PostController;
import com.certificate.platform.controller.SponsorController;
import com.certificate.platform.controller.ViewsController;
import com.certificate.platform.dto.*;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import com.certificate.platform.service.*;
import com.certificate.platform.util.TokenProvider;
import com.certificate.platform.util.ViewCalculator;
import com.certificate.platform.security.AuthInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tier 3: Pairwise & Cross-Feature Combination Tests
 * Validates complex interactions between subsystems:
 * - Badge Creation -> User Assignment -> Post Retrieval -> Sponsor Rotation
 * - View Tracking -> Debouncing -> Real-time Earnings Calculation
 * - Session Management -> Role Enforcement -> Invalidation Mid-Interaction
 * - Multi-session concurrency & Sponsor deactivation impacts
 */
@DisplayName("Tier 3 - Pairwise Combinations Test Suite")
@ExtendWith(MockitoExtension.class)
public class Tier3CombinationsTest {

    @Mock private BadgeRepository badgeRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private UserRepository userRepository;
    @Mock private InstitutionRepository institutionRepository;
    @Mock private SponsorRepository sponsorRepository;
    @Mock private SponsorBadgeRepository sponsorBadgeRepository;
    @Mock private PostRepository postRepository;
    @Mock private PostMediaRepository postMediaRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private LikeRepository likeRepository;
    @Mock private ViewEventRepository viewEventRepository;
    @Mock private EarningRepository earningRepository;
    @Mock private SessionRepository sessionRepository;
    @Mock private AuditLogRepository auditLogRepository;

    private BadgeService badgeService;
    private SponsorService sponsorService;
    private PostService postService;
    private ViewService viewService;
    private EarningService earningService;
    private SessionService sessionService;
    private AuditService auditService;
    private AuthInterceptor authInterceptor;

    private User athleteUser;
    private User institutionUser;
    private Institution institution;
    private Badge championshipBadge;
    private Sponsor primarySponsor;
    private Sponsor secondarySponsor;
    private Post userPost;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        sessionService = new SessionService(sessionRepository, userRepository);
        auditService = new AuditService(auditLogRepository);
        authInterceptor = new AuthInterceptor(sessionService, userRepository, auditService);

        badgeService = new BadgeService(
                badgeRepository, userBadgeRepository, userRepository, institutionRepository, sponsorBadgeRepository, auditService);
        sponsorService = new SponsorService(
                sponsorRepository, sponsorBadgeRepository, badgeRepository);
        postService = new PostService(
                postRepository, postMediaRepository, commentRepository, userRepository,
                likeRepository, userBadgeRepository, sponsorBadgeRepository);
        viewService = new ViewService(
                viewEventRepository, sponsorRepository, userRepository, postRepository, postService,
                userBadgeRepository, sponsorBadgeRepository, auditService);
        earningService = new EarningService(
                earningRepository, userRepository, sponsorRepository, viewEventRepository);

        athleteUser = User.builder()
                .id(10L)
                .username("pro_athlete")
                .displayName("Pro Athlete")
                .role(User.Role.USER)
                .build();

        institutionUser = User.builder()
                .id(20L)
                .username("national_federation")
                .role(User.Role.INSTITUTION)
                .build();

        institution = Institution.builder()
                .id(100L)
                .name("National Athletics Federation")
                .user(institutionUser)
                .build();

        championshipBadge = Badge.builder()
                .id(50L)
                .name("National Championship Gold")
                .rank(1)
                .institution(institution)
                .build();

        primarySponsor = Sponsor.builder()
                .id(201L)
                .name("Nike Pro Performance")
                .websiteUrl("https://nike.com")
                .isActive(true)
                .build();

        secondarySponsor = Sponsor.builder()
                .id(202L)
                .name("RedBull Athletic")
                .websiteUrl("https://redbull.com")
                .isActive(true)
                .build();

        userPost = Post.builder()
                .id(800L)
                .user(athleteUser)
                .content("Victory sprint training completed!")
                .viewsCount(10)
                .build();
    }

    @Test
    @DisplayName("C1: View tracking resolves author's rotating sponsor and increments views count")
    void comb_1_viewTracking_duringActiveSponsorRotation() {
        when(postRepository.findById(800L)).thenReturn(Optional.of(userPost));
        when(viewEventRepository.findRecentViewsForPost(eq(800L), any(LocalDateTime.class), eq("sess-rot"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());

        UserBadge ub = UserBadge.builder().user(athleteUser).badge(championshipBadge).build();
        when(userBadgeRepository.findByUserId(10L)).thenReturn(List.of(ub));

        SponsorBadge sb = SponsorBadge.builder().sponsor(primarySponsor).badge(championshipBadge).priority(10).isActive(true).build();
        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(50L)).thenReturn(List.of(sb));

        ViewEventRequest req = ViewEventRequest.builder()
                .postId(800L)
                .sessionId("sess-rot")
                .durationMs(3000L)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(req);

        assertThat(response.isRecorded()).isTrue();
        assertThat(response.isIncremented()).isTrue();
        verify(viewEventRepository, times(1)).save(argThat(event ->
                event.getSponsor() != null && event.getSponsor().getId().equals(201L)
        ));
    }

    @Test
    @DisplayName("C2: Session invalidation mid-interaction: Valid view recorded, then logout rejects subsequent calls")
    void comb_2_sessionInvalidation_midInteraction() throws Exception {
        String sessionToken = TokenProvider.generateToken(10L, "pro_athlete", "USER");
        Session session = Session.builder().id(1L).token(sessionToken).user(athleteUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByTokenAndIsActiveTrue(sessionToken)).thenReturn(Optional.of(session));
        when(sessionRepository.findByToken(sessionToken)).thenReturn(Optional.of(session));

        // Interaction 1: Session is active, request succeeds
        assertThat(sessionService.isSessionActive(sessionToken)).isTrue();

        // Interaction 2: User initiates logout -> session invalidated
        sessionService.invalidateSession(sessionToken);
        when(sessionRepository.findByTokenAndIsActiveTrue(sessionToken)).thenReturn(Optional.empty());

        // Interaction 3: Mid-interaction request with invalidated session is rejected by AuthInterceptor
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
        req.addHeader("Authorization", "Bearer " + sessionToken);
        MockHttpServletResponse res = new MockHttpServletResponse();
        boolean authorized = authInterceptor.preHandle(req, res, new Object());

        assertThat(authorized).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(sessionService.isSessionActive(sessionToken)).isFalse();
    }

    @Test
    @DisplayName("C3: Badge creation -> User assignment -> Post retrieval verifies embedded sponsors")
    void comb_3_badgeCreation_userAssignment_postRetrievalLinkedSponsors() {
        // 1. Badge awarded to athlete
        UserBadge ub = UserBadge.builder().id(1L).user(athleteUser).badge(championshipBadge).build();
        when(userBadgeRepository.findByUserId(10L)).thenReturn(List.of(ub));

        // 2. Sponsor linked to badge
        SponsorBadge linkPrimary = SponsorBadge.builder().sponsor(primarySponsor).badge(championshipBadge).priority(20).isActive(true).build();
        SponsorBadge linkSecondary = SponsorBadge.builder().sponsor(secondarySponsor).badge(championshipBadge).priority(5).isActive(true).build();
        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(50L)).thenReturn(List.of(linkPrimary, linkSecondary));

        // 3. Post retrieval for athlete's post
        when(postRepository.findById(800L)).thenReturn(Optional.of(userPost));
        when(postMediaRepository.findByPostIdOrderByDisplayOrderAsc(800L)).thenReturn(Collections.emptyList());

        PostResponse postResponse = postService.getPost(800L);

        assertThat(postResponse).isNotNull();
        assertThat(postResponse.getUserBadges()).hasSize(1);
        assertThat(postResponse.getUserBadges().get(0).getBadge().getName()).isEqualTo("National Championship Gold");

        assertThat(postResponse.getSponsors()).hasSize(2);
        // Priority descending: Nike (20) first, RedBull (5) second
        assertThat(postResponse.getSponsors().get(0).getName()).isEqualTo("Nike Pro Performance");
        assertThat(postResponse.getSponsors().get(1).getName()).isEqualTo("RedBull Athletic");
    }

    @Test
    @DisplayName("C4: Multiple sessions tracking views on same post concurrently")
    void comb_4_multiSessionConcurrentPostViews() {
        when(postRepository.findById(800L)).thenReturn(Optional.of(userPost));
        when(viewEventRepository.findRecentViewsForPost(eq(800L), any(LocalDateTime.class), eq("session-1"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());
        when(viewEventRepository.findRecentViewsForPost(eq(800L), any(LocalDateTime.class), eq("session-2"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());

        // First view from session 1: qualifies
        ViewEventRequest req1 = ViewEventRequest.builder().postId(800L).sessionId("session-1").durationMs(2200L).build();
        ViewEventResponse resp1 = viewService.recordViewEvent(req1);

        // View from session 2: qualifies
        ViewEventRequest req2 = ViewEventRequest.builder().postId(800L).sessionId("session-2").durationMs(2500L).build();
        ViewEventResponse resp2 = viewService.recordViewEvent(req2);

        assertThat(resp1.isIncremented()).isTrue();
        assertThat(resp2.isIncremented()).isTrue();
    }

    @Test
    @DisplayName("C5: Institution token validates badge assignment, then queries user profile")
    void comb_5_institutionRoleToken_assignsBadges_thenRetrievesUserProfile() {
        String instToken = TokenProvider.generateToken(20L, "national_federation", "INSTITUTION");
        String role = new String(Base64.getUrlDecoder().decode(instToken)).split(":")[2];
        assertThat(role).isEqualTo("INSTITUTION");

        when(userRepository.findById(10L)).thenReturn(Optional.of(athleteUser));
        when(badgeRepository.findById(50L)).thenReturn(Optional.of(championshipBadge));
        when(institutionRepository.findById(100L)).thenReturn(Optional.of(institution));
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignBadgeRequest assignReq = AssignBadgeRequest.builder()
                .userId(10L)
                .badgeId(50L)
                .institutionId(100L)
                .build();

        UserBadgeResponse assigned = badgeService.assignBadgeToUser(assignReq);
        assertThat(assigned.getBadge().getName()).isEqualTo("National Championship Gold");

        // Query user badges (e.g. for user profile)
        UserBadge ub = UserBadge.builder().user(athleteUser).badge(championshipBadge).awardedBy(institution).build();
        when(userBadgeRepository.findByUserId(10L)).thenReturn(List.of(ub));

        List<UserBadgeResponse> userBadges = badgeService.getUserBadges(10L);
        assertThat(userBadges).hasSize(1);
        assertThat(userBadges.get(0).getAwardedByInstitutionName()).isEqualTo("National Athletics Federation");
    }

    @Test
    @DisplayName("C6: Sponsor deactivation instantly removes sponsor from post rotation list")
    void comb_6_sponsorDeactivation_affectsPostEmbeddedSponsors() {
        UserBadge ub = UserBadge.builder().user(athleteUser).badge(championshipBadge).build();
        when(userBadgeRepository.findByUserId(10L)).thenReturn(List.of(ub));

        // Deactivated sponsor
        Sponsor deactivatedSponsor = Sponsor.builder().id(999L).name("Expired Sponsor").isActive(false).build();
        SponsorBadge sbDeactivated = SponsorBadge.builder().sponsor(deactivatedSponsor).badge(championshipBadge).priority(100).isActive(true).build();
        SponsorBadge sbActive = SponsorBadge.builder().sponsor(primarySponsor).badge(championshipBadge).priority(10).isActive(true).build();

        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(50L)).thenReturn(List.of(sbDeactivated, sbActive));
        when(postRepository.findById(800L)).thenReturn(Optional.of(userPost));
        when(postMediaRepository.findByPostIdOrderByDisplayOrderAsc(800L)).thenReturn(Collections.emptyList());

        PostResponse postResponse = postService.getPost(800L);

        // Deactivated sponsor filtered out despite higher priority
        assertThat(postResponse.getSponsors()).hasSize(1);
        assertThat(postResponse.getSponsors().get(0).getName()).isEqualTo("Nike Pro Performance");
    }

    @Test
    @DisplayName("C7: Debounced views accumulate accurately into real-time earnings")
    void comb_7_debouncedViews_accumulateToRealtimeEarnings() {
        LocalDateTime now = LocalDateTime.now();
        List<ViewEvent> events = new ArrayList<>();

        // 1st view at t0: 2500ms -> qualifies
        events.add(ViewEvent.builder().sessionId("sess-x").durationMs(2500L).viewedAt(now).build());
        // 2nd view at t+5s: 3000ms -> debounced
        events.add(ViewEvent.builder().sessionId("sess-x").durationMs(3000L).viewedAt(now.plusSeconds(5)).build());
        // 3rd view at t+10s: 2100ms -> debounced
        events.add(ViewEvent.builder().sessionId("sess-x").durationMs(2100L).viewedAt(now.plusSeconds(10)).build());
        // 4th view at t+35s: 2200ms -> qualifies
        events.add(ViewEvent.builder().sessionId("sess-x").durationMs(2200L).viewedAt(now.plusSeconds(35)).build());

        long qualifyingCount = ViewCalculator.countQualifyingViews(events);
        BigDecimal earnings = ViewCalculator.calculateEarnings(qualifyingCount);

        assertThat(qualifyingCount).isEqualTo(2L);
        assertThat(earnings).isEqualTo(new BigDecimal("0.04")); // 2 * 0.02
    }

    @Test
    @DisplayName("C8: Multiple badges with overlapping sponsors deduplicate sponsors in post response")
    void comb_8_multipleBadgesMultipleSponsors_deduplicatesPostSponsors() {
        Badge badgeA = Badge.builder().id(1L).name("Badge A").rank(1).build();
        Badge badgeB = Badge.builder().id(2L).name("Badge B").rank(2).build();

        UserBadge ubA = UserBadge.builder().user(athleteUser).badge(badgeA).build();
        UserBadge ubB = UserBadge.builder().user(athleteUser).badge(badgeB).build();
        when(userBadgeRepository.findByUserId(10L)).thenReturn(List.of(ubA, ubB));

        // Both badges linked to same sponsor Nike
        SponsorBadge sb1 = SponsorBadge.builder().sponsor(primarySponsor).badge(badgeA).priority(5).isActive(true).build();
        SponsorBadge sb2 = SponsorBadge.builder().sponsor(primarySponsor).badge(badgeB).priority(15).isActive(true).build();

        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(1L)).thenReturn(List.of(sb1));
        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(2L)).thenReturn(List.of(sb2));

        when(postRepository.findById(800L)).thenReturn(Optional.of(userPost));
        when(postMediaRepository.findByPostIdOrderByDisplayOrderAsc(800L)).thenReturn(Collections.emptyList());

        PostResponse postResponse = postService.getPost(800L);

        // Deduplicated: Nike appears once
        assertThat(postResponse.getSponsors()).hasSize(1);
        assertThat(postResponse.getSponsors().get(0).getName()).isEqualTo("Nike Pro Performance");
    }

    @Test
    @DisplayName("C9: Anonymous views do not debounce each other while identified views debounce")
    void comb_9_anonymousVsIdentifiedViews_debouncingInteraction() {
        LocalDateTime t = LocalDateTime.now();

        // Two anonymous views without session/IP at same second: both count
        ViewEvent anon1 = ViewEvent.builder().durationMs(2500L).viewedAt(t).build();
        ViewEvent anon2 = ViewEvent.builder().durationMs(2500L).viewedAt(t).build();

        // Two identified views from same session at same second: only 1 counts
        ViewEvent id1 = ViewEvent.builder().sessionId("identified").durationMs(2500L).viewedAt(t).build();
        ViewEvent id2 = ViewEvent.builder().sessionId("identified").durationMs(2500L).viewedAt(t).build();

        long anonCount = ViewCalculator.countQualifyingViews(List.of(anon1, anon2));
        long idCount = ViewCalculator.countQualifyingViews(List.of(id1, id2));

        assertThat(anonCount).isEqualTo(2L);
        assertThat(idCount).isEqualTo(1L);
    }

    @Test
    @DisplayName("C10: Audit trail aggregates across badge assignment and view events")
    void comb_10_auditTrail_aggregatesAcrossBadgeAssignmentAndViewEvents() {
        AuditLog log1 = AuditLog.builder()
                .id(1L)
                .user(institutionUser)
                .eventType("BADGE_ASSIGN")
                .details("Badge 50 assigned to user 10")
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .build();
        AuditLog log2 = AuditLog.builder()
                .id(2L)
                .user(athleteUser)
                .eventType("VIEW")
                .details("Post 800 viewed")
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .build();

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(log2, log1));

        auditService.logEvent(institutionUser, "BADGE_ASSIGN", "Badge 50 assigned to user 10", "127.0.0.1");
        auditService.logEvent(athleteUser, "VIEW", "Post 800 viewed", "127.0.0.1");

        List<AuditLogResponse> logs = auditService.getLogs();

        assertThat(logs).hasSize(2);
        assertThat(logs.get(0).getEventType()).isEqualTo("VIEW");
        assertThat(logs.get(1).getEventType()).isEqualTo("BADGE_ASSIGN");
    }

    @Test
    @DisplayName("C11: User role attempting institutional action is rejected")
    void comb_11_userRoleAttemptingInstitutionAction_producesAuditRejection() throws Exception {
        String userToken = TokenProvider.generateToken(10L, "athlete", "USER");
        Session session = Session.builder().id(1L).token(userToken).user(athleteUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByToken(userToken)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(userToken)).thenReturn(Optional.of(session));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + userToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        verify(auditLogRepository).save(argThat(l -> "SECURITY_DENIED".equals(l.getEventType())));
    }

    @Test
    @DisplayName("C12: Post views earnings breakdown reflects distinct sponsors accurately")
    void comb_12_postViewsEarningsBreakdown_bySponsor() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(athleteUser));
        when(sponsorRepository.findByIsActiveTrue()).thenReturn(List.of(primarySponsor, secondarySponsor));

        ViewEvent vNike = ViewEvent.builder().sessionId("s1").durationMs(2500L).viewedAt(LocalDateTime.now()).build();
        ViewEvent vRedBull = ViewEvent.builder().sessionId("s2").durationMs(2500L).viewedAt(LocalDateTime.now()).build();

        when(viewEventRepository.findQualifyingViewsByUser(eq(10L), eq(201L), any(), any())).thenReturn(List.of(vNike));
        when(viewEventRepository.findQualifyingViewsByUser(eq(10L), eq(202L), any(), any())).thenReturn(List.of(vRedBull));
        when(userRepository.getReferenceById(10L)).thenReturn(athleteUser);

        EarningsSummary summary = earningService.calculateEarnings(10L, "2026-11");

        assertThat(summary.getTotalViews()).isEqualTo(2L);
        assertThat(summary.getTotalEarnings()).isEqualTo(new BigDecimal("0.04"));
        assertThat(summary.getSponsorBreakdown()).hasSize(2);
    }
}
