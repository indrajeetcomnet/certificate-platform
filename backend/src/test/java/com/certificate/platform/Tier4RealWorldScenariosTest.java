package com.certificate.platform;

import com.certificate.platform.dto.*;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tier 4: Real-World Application Workload Scenarios
 * Validates realistic, multi-step end-to-end user journeys:
 *  - Scenario 1: Institution Badge Issuance & User Profile Verification
 *  - Scenario 2: Feed Post Creation with Linked Sponsor Rotation
 *  - Scenario 3: Debounced View Tracking & Live INR Earnings Accumulation
 *  - Scenario 4: User Session Lifecycle with Audit Trail
 *  - Scenario 5: Full Institutional End-to-End Workflow (Badge -> Post -> Sponsor -> View -> Earnings -> Session Wipe)
 */
@DisplayName("Tier 4 - Real-World Scenarios Test Suite")
@ExtendWith(MockitoExtension.class)
public class Tier4RealWorldScenariosTest {

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
    private AuthService authService;
    private SessionService sessionService;
    private AuditService auditService;
    private AuthInterceptor authInterceptor;

    private User athleteUser;
    private User institutionUser;
    private Institution athlosInstitution;

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
        authService = new AuthService(userRepository, institutionRepository, sessionService, auditService);

        athleteUser = User.builder()
                .id(100L)
                .username("pro_runner")
                .displayName("Pro Runner")
                .role(User.Role.USER)
                .build();

        institutionUser = User.builder()
                .id(200L)
                .username("athlos_academy")
                .displayName("Athlos Sports Academy")
                .role(User.Role.INSTITUTION)
                .build();

        athlosInstitution = Institution.builder()
                .id(10L)
                .name("Athlos Sports Academy")
                .description("Accredited Sports Academy")
                .user(institutionUser)
                .verified(true)
                .build();
    }

    @Test
    @DisplayName("Scenario 1: Institution Badge Issuance & User Profile Verification")
    void scenario1_institutionBadgeIssuanceAndUserProfileVerification() {
        // Step 1: Institution creates "National Athletics Gold" badge
        CreateBadgeRequest createBadgeReq = CreateBadgeRequest.builder()
                .name("National Athletics Gold")
                .rank(1)
                .category("Track & Field")
                .iconUrl("https://example.com/gold.png")
                .description("100m sprint gold medalist")
                .institutionId(10L)
                .build();

        Badge persistedBadge = Badge.builder()
                .id(1L)
                .name(createBadgeReq.getName())
                .rank(createBadgeReq.getRank())
                .category(createBadgeReq.getCategory())
                .iconUrl(createBadgeReq.getIconUrl())
                .description(createBadgeReq.getDescription())
                .institution(athlosInstitution)
                .createdAt(LocalDateTime.now())
                .build();

        when(institutionRepository.findById(10L)).thenReturn(Optional.of(athlosInstitution));
        when(badgeRepository.save(any(Badge.class))).thenReturn(persistedBadge);

        BadgeResponse createdBadge = badgeService.createBadge(createBadgeReq);
        assertThat(createdBadge).isNotNull();
        assertThat(createdBadge.getName()).isEqualTo("National Athletics Gold");
        assertThat(createdBadge.getRankDisplay()).isEqualTo("Gold");
        assertThat(createdBadge.getInstitutionName()).isEqualTo("Athlos Sports Academy");

        // Step 2: Institution assigns badge to athlete
        AssignBadgeRequest assignReq = AssignBadgeRequest.builder()
                .userId(100L)
                .badgeId(1L)
                .institutionId(10L)
                .build();

        UserBadge userBadge = UserBadge.builder()
                .id(10L)
                .user(athleteUser)
                .badge(persistedBadge)
                .awardedBy(athlosInstitution)
                .awardedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(athleteUser));
        when(badgeRepository.findById(1L)).thenReturn(Optional.of(persistedBadge));
        when(userBadgeRepository.save(any(UserBadge.class))).thenReturn(userBadge);

        UserBadgeResponse assignedResponse = badgeService.assignBadgeToUser(assignReq);
        assertThat(assignedResponse).isNotNull();
        assertThat(assignedResponse.getBadge().getName()).isEqualTo("National Athletics Gold");
        assertThat(assignedResponse.getAwardedByInstitutionName()).isEqualTo("Athlos Sports Academy");

        // Step 3: Recipient athlete retrieves profile badges
        when(userBadgeRepository.findByUserId(100L)).thenReturn(List.of(userBadge));

        List<UserBadgeResponse> profileBadges = badgeService.getUserBadges(100L);
        assertThat(profileBadges).hasSize(1);
        assertThat(profileBadges.get(0).getBadge().getName()).isEqualTo("National Athletics Gold");
        assertThat(profileBadges.get(0).getBadge().getRankDisplay()).isEqualTo("Gold");
        assertThat(profileBadges.get(0).getAwardedByInstitutionName()).isEqualTo("Athlos Sports Academy");
    }

    @Test
    @DisplayName("Scenario 2: Feed Post Creation with Linked Sponsor Rotation")
    void scenario2_feedPostCreationWithLinkedSponsorRotation() {
        // Step 1: Setup athlete with Gold badge
        Badge goldBadge = Badge.builder().id(1L).name("Gold Medal").rank(1).build();
        UserBadge athleteBadge = UserBadge.builder().user(athleteUser).badge(goldBadge).build();
        when(userBadgeRepository.findByUserId(100L)).thenReturn(List.of(athleteBadge));

        // Step 2: Setup two active brand sponsors linked to the badge with priorities
        Sponsor nike = Sponsor.builder().id(501L).name("Nike Pro Performance").isActive(true).build();
        Sponsor redBull = Sponsor.builder().id(502L).name("RedBull Athletic Power").isActive(true).build();

        SponsorBadge sbNike = SponsorBadge.builder().sponsor(nike).badge(goldBadge).priority(10).isActive(true).build();
        SponsorBadge sbRedBull = SponsorBadge.builder().sponsor(redBull).badge(goldBadge).priority(5).isActive(true).build();
        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(1L)).thenReturn(List.of(sbNike, sbRedBull));

        // Step 3: Athlete creates feed post
        Post newPost = Post.builder()
                .id(700L)
                .user(athleteUser)
                .content("Final preparatory sprint training session before nationals!")
                .likesCount(0)
                .commentsCount(0)
                .viewsCount(0)
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(athleteUser));
        when(postRepository.save(any(Post.class))).thenReturn(newPost);
        when(postMediaRepository.findByPostIdOrderByDisplayOrderAsc(700L)).thenReturn(Collections.emptyList());

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Final preparatory sprint training session before nationals!")
                .build();

        PostResponse createdPost = postService.createPost(postReq, 100L);

        // Step 4: Verify post embeds author badge and sponsors sorted by priority descending
        assertThat(createdPost.getUserBadges()).hasSize(1);
        assertThat(createdPost.getUserBadges().get(0).getBadge().getName()).isEqualTo("Gold Medal");

        assertThat(createdPost.getSponsors()).hasSize(2);
        assertThat(createdPost.getSponsors().get(0).getName()).isEqualTo("Nike Pro Performance");
        assertThat(createdPost.getSponsors().get(1).getName()).isEqualTo("RedBull Athletic Power");
    }

    @Test
    @DisplayName("Scenario 3: Debounced View Tracking & Live INR Earnings Accumulation")
    void scenario3_debouncedViewTrackingAndLiveInrEarningsAccumulation() {
        Post post = Post.builder().id(700L).user(athleteUser).viewsCount(0).build();
        LocalDateTime baseTime = LocalDateTime.now();
        List<ViewEvent> recordedEvents = new ArrayList<>();

        // Action 1: Session A views post for 2500ms (qualifies -> count 1)
        ViewEvent viewA1 = ViewEvent.builder().sessionId("sess-A").durationMs(2500L).viewedAt(baseTime).build();
        recordedEvents.add(viewA1);

        // Action 2: Session A refreshes 5s later for 3000ms (duplicate within 30s -> debounced)
        ViewEvent viewA2 = ViewEvent.builder().sessionId("sess-A").durationMs(3000L).viewedAt(baseTime.plusSeconds(5)).build();
        recordedEvents.add(viewA2);

        // Action 3: Session B views post for 1500ms (short view < 2000ms -> disqualified)
        ViewEvent viewB1 = ViewEvent.builder().sessionId("sess-B").durationMs(1500L).viewedAt(baseTime.plusSeconds(10)).build();
        recordedEvents.add(viewB1);

        // Action 4: Session B views post for 2200ms 35s later (qualifies -> count 2)
        ViewEvent viewB2 = ViewEvent.builder().sessionId("sess-B").durationMs(2200L).viewedAt(baseTime.plusSeconds(35)).build();
        recordedEvents.add(viewB2);

        // Action 5: Session C views post for 4000ms (distinct session -> count 3)
        ViewEvent viewC1 = ViewEvent.builder().sessionId("sess-C").durationMs(4000L).viewedAt(baseTime.plusSeconds(40)).build();
        recordedEvents.add(viewC1);

        // Calculate qualifying views and live earnings
        long qualifyingCount = ViewCalculator.countQualifyingViews(recordedEvents);
        BigDecimal earnings = ViewCalculator.calculateEarnings(qualifyingCount);

        assertThat(qualifyingCount).isEqualTo(3L);
        assertThat(earnings).isEqualTo(new BigDecimal("0.06")); // 3 * 0.02
        assertThat(ViewCalculator.RATE_PER_THOUSAND).isEqualTo(new BigDecimal("20.00"));
    }

    @Test
    @DisplayName("Scenario 4: User Session Lifecycle with Audit Trail")
    void scenario4_userSessionLifecycleWithAuditTrail() throws Exception {
        // Step 1: User Login & Session Creation
        String token = TokenProvider.generateToken(100L, "pro_runner", "USER");
        Session session = Session.builder()
                .id(1L)
                .token(token)
                .user(athleteUser)
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));

        sessionService.createSession(athleteUser, token, "Mozilla/5.0", "127.0.0.1", Duration.ofDays(7));
        auditService.logEvent(athleteUser, "LOGIN", "User authenticated successfully", "127.0.0.1");

        assertThat(sessionService.isSessionActive(token)).isTrue();
        verify(sessionRepository).save(any(Session.class));
        verify(auditLogRepository).save(argThat(log -> "LOGIN".equals(log.getEventType())));

        // Step 2: User Action (Debounced View Recording)
        ViewEventRequest viewReq = ViewEventRequest.builder()
                .postId(888L)
                .sessionId("sess-sc4")
                .durationMs(2500L)
                .userId(100L)
                .build();
        when(postRepository.findById(888L)).thenReturn(Optional.of(Post.builder().id(888L).viewsCount(10).build()));
        when(postService.incrementViewsCount(888L)).thenReturn(1);

        ViewEventResponse viewRes = viewService.recordViewEvent(viewReq);
        assertThat(viewRes.isRecorded()).isTrue();
        verify(auditLogRepository).save(argThat(log -> "VIEW".equals(log.getEventType())));

        // Step 3: User Logout & Session Invalidation
        sessionService.invalidateSession(token);
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.empty());
        auditService.logEvent(athleteUser, "LOGOUT", "Session invalidated and wiped", "127.0.0.1");

        assertThat(sessionService.isSessionActive(token)).isFalse();
        verify(auditLogRepository).save(argThat(log -> "LOGOUT".equals(log.getEventType())));

        // Step 4: Verification - Subsequent Protected Request is Rejected
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();
        boolean authorized = authInterceptor.preHandle(req, res, new Object());

        assertThat(authorized).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("Scenario 5: Full Institutional End-to-End Workflow (Badge -> Post -> Sponsor -> View -> Earnings -> Session Wipe)")
    void scenario5_fullInstitutionalEndToEndWorkflow() throws Exception {
        // Step 1: Institution authentication & session generation
        String instToken = TokenProvider.generateToken(200L, "athlos_academy", "INSTITUTION");
        assertThat(instToken).isNotBlank();
        String role = new String(Base64.getUrlDecoder().decode(instToken)).split(":")[2];
        assertThat(role).isEqualTo("INSTITUTION");

        // Step 2: Competition badge creation & brand sponsor linking
        Badge tournamentBadge = Badge.builder().id(99L).name("All-Star Gold").rank(1).institution(athlosInstitution).build();
        Sponsor sponsor = Sponsor.builder().id(33L).name("Puma Nitro").isActive(true).build();
        SponsorBadge link = SponsorBadge.builder().sponsor(sponsor).badge(tournamentBadge).priority(10).isActive(true).build();

        when(badgeRepository.findById(99L)).thenReturn(Optional.of(tournamentBadge));
        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(99L)).thenReturn(List.of(link));

        // Step 3: Badge assignment to athlete user
        UserBadge userBadge = UserBadge.builder().user(athleteUser).badge(tournamentBadge).awardedBy(athlosInstitution).build();
        when(userBadgeRepository.findByUserId(100L)).thenReturn(List.of(userBadge));

        // Step 4: Athlete creates tournament post
        Post post = Post.builder().id(888L).user(athleteUser).content("Tournament victory!").viewsCount(0).build();
        when(postRepository.findById(888L)).thenReturn(Optional.of(post));
        when(postMediaRepository.findByPostIdOrderByDisplayOrderAsc(888L)).thenReturn(Collections.emptyList());

        PostResponse postDetails = postService.getPost(888L);
        assertThat(postDetails.getUserBadges()).hasSize(1);
        assertThat(postDetails.getSponsors()).hasSize(1);
        assertThat(postDetails.getSponsors().get(0).getName()).isEqualTo("Puma Nitro");

        // Step 5: Viewers interact with qualifying debounced views
        List<ViewEvent> views = List.of(
                ViewEvent.builder().sessionId("sess-1").durationMs(2500L).viewedAt(LocalDateTime.now()).build(),
                ViewEvent.builder().sessionId("sess-2").durationMs(3000L).viewedAt(LocalDateTime.now()).build()
        );
        long qualifyingViews = ViewCalculator.countQualifyingViews(views);
        assertThat(qualifyingViews).isEqualTo(2L);

        // Step 6: Live INR earnings accumulation
        BigDecimal earnings = ViewCalculator.calculateEarnings(qualifyingViews);
        assertThat(earnings).isEqualTo(new BigDecimal("0.04"));

        // Step 7: Session invalidation and wipe
        Session instSession = Session.builder()
                .id(99L)
                .token(instToken)
                .user(athlosInstitution.getUser())
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        when(sessionRepository.findByToken(instToken)).thenReturn(Optional.of(instSession));
        when(sessionRepository.findByTokenAndIsActiveTrue(instToken)).thenReturn(Optional.of(instSession));

        assertThat(sessionService.isSessionActive(instToken)).isTrue();
        sessionService.invalidateSession(instToken);
        when(sessionRepository.findByTokenAndIsActiveTrue(instToken)).thenReturn(Optional.empty());
        assertThat(sessionService.isSessionActive(instToken)).isFalse();

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + instToken);
        MockHttpServletResponse res = new MockHttpServletResponse();
        boolean allowed = authInterceptor.preHandle(req, res, new Object());
        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }
}
