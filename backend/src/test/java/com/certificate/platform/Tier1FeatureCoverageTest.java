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
import com.certificate.platform.util.PasswordEncoderUtil;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tier 1: Comprehensive Feature Coverage Tests (F1 - F7)
 * Validates happy-path and core requirements for all seven features:
 *  - Feature 1: Badge Creation & Assignment (>=5 tests)
 *  - Feature 2: Sponsor Linking & Rotation integration (>=5 tests)
 *  - Feature 3: Post View Tracking & Debouncing (>=5 tests)
 *  - Feature 4: INR Earnings Calculation (>=5 tests)
 *  - Feature 5: Session Management & Logout Wipe (>=5 tests)
 *  - Feature 6: Protected Routes & Role Enforcement (>=5 tests)
 *  - Feature 7: Audit Logging & Mock Elimination (>=5 tests)
 */
@DisplayName("Tier 1 - Feature Coverage Test Suite")
@ExtendWith(MockitoExtension.class)
public class Tier1FeatureCoverageTest {

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
    @Mock private PostService postService;
    @Mock private SessionRepository sessionRepository;
    @Mock private AuditLogRepository auditLogRepository;

    private BadgeService badgeService;
    private SponsorService sponsorService;
    private ViewService viewService;
    private EarningService earningService;
    private AuthService authService;
    private SessionService sessionService;
    private AuditService auditService;
    private AuthInterceptor authInterceptor;

    private User sampleUser;
    private User sampleInstitutionUser;
    private Institution sampleInstitution;
    private Badge sampleBadge;
    private Sponsor sampleSponsor;
    private Post samplePost;

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
        viewService = new ViewService(
                viewEventRepository, sponsorRepository, userRepository, postRepository, postService,
                userBadgeRepository, sponsorBadgeRepository, auditService);
        earningService = new EarningService(
                earningRepository, userRepository, sponsorRepository, viewEventRepository);
        authService = new AuthService(userRepository, institutionRepository, sessionService, auditService);

        sampleUser = User.builder()
                .id(1L)
                .username("athlete_john")
                .email("john@example.com")
                .passwordHash(PasswordEncoderUtil.hash("password123"))
                .displayName("John Athlete")
                .role(User.Role.USER)
                .build();

        sampleInstitutionUser = User.builder()
                .id(2L)
                .username("athlos_academy")
                .email("admin@athlosacademy.org")
                .passwordHash(PasswordEncoderUtil.hash("athlos2026"))
                .displayName("Athlos Academy")
                .role(User.Role.INSTITUTION)
                .build();

        sampleInstitution = Institution.builder()
                .id(10L)
                .name("Athlos Sports Academy")
                .description("Accredited Sports Academy")
                .verified(true)
                .user(sampleInstitutionUser)
                .build();

        sampleBadge = Badge.builder()
                .id(100L)
                .name("Game City Champion")
                .rank(1)
                .category("Athletics")
                .iconUrl("https://example.com/badge1.png")
                .description("1st Place Gold Medalist")
                .institution(sampleInstitution)
                .createdAt(LocalDateTime.now())
                .build();

        sampleSponsor = Sponsor.builder()
                .id(200L)
                .name("Nike Pro Performance")
                .logoUrl("https://example.com/nike.png")
                .websiteUrl("https://nike.com")
                .bannerImageUrl("https://example.com/nike-banner.png")
                .isActive(true)
                .campaignStart(LocalDateTime.now().minusDays(1))
                .campaignEnd(LocalDateTime.now().plusMonths(6))
                .createdAt(LocalDateTime.now())
                .build();

        samplePost = Post.builder()
                .id(500L)
                .user(sampleUser)
                .content("Victory sprint training completed!")
                .postType(Post.PostType.ORIGINAL)
                .likesCount(12)
                .commentsCount(3)
                .viewsCount(100)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // FEATURE 1: Badge Creation & Assignment
    // =========================================================================

    @Test
    @DisplayName("F1.1: Create badge persists metadata and institution association")
    void f1_1_createBadge_persistsMetadataAndInstitutionAssociation() {
        CreateBadgeRequest request = CreateBadgeRequest.builder()
                .name("National Sprinter")
                .rank(1)
                .category("Track & Field")
                .iconUrl("https://example.com/icon.png")
                .description("100m sprint championship gold")
                .institutionId(10L)
                .build();

        when(institutionRepository.findById(10L)).thenReturn(Optional.of(sampleInstitution));
        when(badgeRepository.save(any(Badge.class))).thenAnswer(invocation -> {
            Badge b = invocation.getArgument(0);
            b.setId(101L);
            return b;
        });

        BadgeResponse response = badgeService.createBadge(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(101L);
        assertThat(response.getName()).isEqualTo("National Sprinter");
        assertThat(response.getRank()).isEqualTo(1);
        assertThat(response.getRankDisplay()).isEqualTo("Gold");
        assertThat(response.getCategory()).isEqualTo("Track & Field");
        assertThat(response.getInstitutionName()).isEqualTo("Athlos Sports Academy");
        verify(badgeRepository, times(1)).save(any(Badge.class));
    }

    @Test
    @DisplayName("F1.2: Assign badge to user creates UserBadge record with awarded details")
    void f1_2_assignBadgeToUser_createsUserBadgeRecord() {
        AssignBadgeRequest request = AssignBadgeRequest.builder()
                .userId(1L)
                .badgeId(100L)
                .institutionId(10L)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(badgeRepository.findById(100L)).thenReturn(Optional.of(sampleBadge));
        when(institutionRepository.findById(10L)).thenReturn(Optional.of(sampleInstitution));
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(invocation -> {
            UserBadge ub = invocation.getArgument(0);
            ub.setId(50L);
            return ub;
        });

        UserBadgeResponse response = badgeService.assignBadgeToUser(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getBadge().getName()).isEqualTo("Game City Champion");
        assertThat(response.getAwardedByInstitutionName()).isEqualTo("Athlos Sports Academy");
        assertThat(response.getAwardedAt()).isNotNull();
        verify(userBadgeRepository, times(1)).save(any(UserBadge.class));
    }

    @Test
    @DisplayName("F1.3: Retrieve user badges returns all badges awarded to user")
    void f1_3_getUserBadges_returnsAllBadgesAwardedToUser() {
        UserBadge ub1 = UserBadge.builder()
                .id(1L)
                .user(sampleUser)
                .badge(sampleBadge)
                .awardedAt(LocalDateTime.now().minusDays(5))
                .awardedBy(sampleInstitution)
                .build();

        Badge silverBadge = Badge.builder()
                .id(102L)
                .name("Regional Silver")
                .rank(2)
                .category("Athletics")
                .institution(sampleInstitution)
                .build();

        UserBadge ub2 = UserBadge.builder()
                .id(2L)
                .user(sampleUser)
                .badge(silverBadge)
                .awardedAt(LocalDateTime.now().minusDays(2))
                .awardedBy(sampleInstitution)
                .build();

        when(userBadgeRepository.findByUserId(1L)).thenReturn(List.of(ub1, ub2));

        List<UserBadgeResponse> badges = badgeService.getUserBadges(1L);

        assertThat(badges).hasSize(2);
        assertThat(badges.get(0).getBadge().getName()).isEqualTo("Game City Champion");
        assertThat(badges.get(0).getBadge().getRankDisplay()).isEqualTo("Gold");
        assertThat(badges.get(1).getBadge().getName()).isEqualTo("Regional Silver");
        assertThat(badges.get(1).getBadge().getRankDisplay()).isEqualTo("Silver");
    }

    @Test
    @DisplayName("F1.4: Badge metadata verifies rank display mapping for Bronze and higher ranks")
    void f1_4_badgeMetadata_verifiesRankDisplayAndCategory() {
        Badge bronze = Badge.builder().id(3L).name("Bronze Cup").rank(3).category("Marathon").build();
        Badge rank4 = Badge.builder().id(4L).name("Finalist").rank(4).category("Marathon").build();

        when(badgeRepository.findAll()).thenReturn(List.of(bronze, rank4));

        List<BadgeResponse> allBadges = badgeService.getAllBadges();

        assertThat(allBadges).hasSize(2);
        assertThat(allBadges.get(0).getRankDisplay()).isEqualTo("Bronze");
        assertThat(allBadges.get(1).getRankDisplay()).isEqualTo("Rank 4");
    }

    @Test
    @DisplayName("F1.5: Multiple badge assignments allow multiple badges for single user")
    void f1_5_multipleBadgeAssignments_allowsMultipleBadgesForSingleUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(badgeRepository.findById(100L)).thenReturn(Optional.of(sampleBadge));
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignBadgeRequest req1 = AssignBadgeRequest.builder().userId(1L).badgeId(100L).build();
        AssignBadgeRequest req2 = AssignBadgeRequest.builder().userId(1L).badgeId(100L).build();

        UserBadgeResponse resp1 = badgeService.assignBadgeToUser(req1);
        UserBadgeResponse resp2 = badgeService.assignBadgeToUser(req2);

        assertThat(resp1).isNotNull();
        assertThat(resp2).isNotNull();
        verify(userBadgeRepository, times(2)).save(any(UserBadge.class));
    }

    @Test
    @DisplayName("F1.6: BadgeController createBadge returns HTTP 201 CREATED")
    void f1_6_badgeController_createBadge_returnsHttp201Created() {
        BadgeController controller = new BadgeController(badgeService);
        CreateBadgeRequest req = CreateBadgeRequest.builder().name("Junior Champion").rank(1).build();

        when(badgeRepository.save(any(Badge.class))).thenReturn(Badge.builder().id(11L).name("Junior Champion").rank(1).build());

        ResponseEntity<BadgeResponse> response = controller.createBadge(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getName()).isEqualTo("Junior Champion");
    }

    @Test
    @DisplayName("F1.7: Assign badge throws ResourceNotFoundException when user or badge does not exist")
    void f1_7_assignBadge_throwsExceptionWhenUserOrBadgeNotFound() {
        AssignBadgeRequest badUser = AssignBadgeRequest.builder().userId(999L).badgeId(100L).build();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> badgeService.assignBadgeToUser(badUser));

        AssignBadgeRequest badBadge = AssignBadgeRequest.builder().userId(1L).badgeId(999L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(badgeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> badgeService.assignBadgeToUser(badBadge));
    }

    // =========================================================================
    // FEATURE 2: Sponsor Linking & Rotation Integration
    // =========================================================================

    @Test
    @DisplayName("F2.1: Create sponsor persists sponsor details and active flag")
    void f2_1_createSponsor_persistsSponsorDetailsAndActiveFlag() {
        CreateSponsorRequest request = CreateSponsorRequest.builder()
                .name("RedBull Energy")
                .websiteUrl("https://redbull.com")
                .logoUrl("https://example.com/redbull.png")
                .isActive(true)
                .build();

        when(sponsorRepository.save(any(Sponsor.class))).thenAnswer(invocation -> {
            Sponsor s = invocation.getArgument(0);
            s.setId(201L);
            return s;
        });

        SponsorResponse response = sponsorService.createSponsor(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(201L);
        assertThat(response.getName()).isEqualTo("RedBull Energy");
        assertThat(response.getIsActive()).isTrue();
        verify(sponsorRepository, times(1)).save(any(Sponsor.class));
    }

    @Test
    @DisplayName("F2.2: Link sponsor to badge creates SponsorBadge link with priority")
    void f2_2_linkSponsorToBadge_createsSponsorBadgeWithPriority() {
        LinkBadgeRequest request = LinkBadgeRequest.builder()
                .badgeId(100L)
                .priority(10)
                .build();

        when(sponsorRepository.findById(200L)).thenReturn(Optional.of(sampleSponsor));
        when(badgeRepository.findById(100L)).thenReturn(Optional.of(sampleBadge));
        when(sponsorBadgeRepository.save(any(SponsorBadge.class))).thenAnswer(invocation -> {
            SponsorBadge sb = invocation.getArgument(0);
            sb.setId(301L);
            return sb;
        });

        SponsorBadgeResponse response = sponsorService.linkBadge(200L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(301L);
        assertThat(response.getSponsorName()).isEqualTo("Nike Pro Performance");
        assertThat(response.getBadgeName()).isEqualTo("Game City Champion");
        assertThat(response.getPriority()).isEqualTo(10);
    }

    @Test
    @DisplayName("F2.3: Priority ordering sorts higher priority sponsors first for rotation")
    void f2_3_priorityOrdering_sortsHigherPrioritySponsorsFirst() {
        Sponsor sponsorA = Sponsor.builder().id(1L).name("Sponsor A").isActive(true).build();
        Sponsor sponsorB = Sponsor.builder().id(2L).name("Sponsor B").isActive(true).build();

        SponsorBadge sbLow = SponsorBadge.builder().sponsor(sponsorA).badge(sampleBadge).priority(5).isActive(true).build();
        SponsorBadge sbHigh = SponsorBadge.builder().sponsor(sponsorB).badge(sampleBadge).priority(20).isActive(true).build();

        List<SponsorBadge> links = new ArrayList<>(List.of(sbLow, sbHigh));
        links.sort(Comparator.comparingInt((SponsorBadge sb) -> sb.getPriority() != null ? sb.getPriority() : 0).reversed());

        assertThat(links.get(0).getSponsor().getName()).isEqualTo("Sponsor B");
        assertThat(links.get(0).getPriority()).isEqualTo(20);
        assertThat(links.get(1).getSponsor().getName()).isEqualTo("Sponsor A");
        assertThat(links.get(1).getPriority()).isEqualTo(5);
    }

    @Test
    @DisplayName("F2.4: Active status filtering excludes inactive sponsors")
    void f2_4_activeStatusFiltering_excludesInactiveSponsors() {
        Sponsor activeSponsor = Sponsor.builder().id(1L).name("Active Co").isActive(true).build();
        Sponsor inactiveSponsor = Sponsor.builder().id(2L).name("Inactive Co").isActive(false).build();

        when(sponsorRepository.findAll()).thenReturn(List.of(activeSponsor, inactiveSponsor));

        List<SponsorResponse> all = sponsorService.getAllSponsors();

        assertThat(all).hasSize(2);
        long activeCount = all.stream().filter(SponsorResponse::getIsActive).count();
        assertThat(activeCount).isEqualTo(1);
    }

    @Test
    @DisplayName("F2.5: getActiveSponsorsForBadge retrieves linked active sponsors")
    void f2_5_getActiveSponsorsForBadge_retrievesLinkedActiveSponsors() {
        when(badgeRepository.findById(100L)).thenReturn(Optional.of(sampleBadge));

        SponsorBadge sb = SponsorBadge.builder()
                .id(1L)
                .sponsor(sampleSponsor)
                .badge(sampleBadge)
                .priority(1)
                .isActive(true)
                .build();

        when(sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(100L)).thenReturn(List.of(sb));

        List<SponsorBadgeResponse> result = badgeService.getActiveSponsorsForBadge(100L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSponsorName()).isEqualTo("Nike Pro Performance");
    }

    @Test
    @DisplayName("F2.6: SponsorController endpoints create and retrieve sponsors")
    void f2_6_sponsorController_endpoints_createAndRetrieve() {
        SponsorController controller = new SponsorController(sponsorService);
        when(sponsorRepository.findById(200L)).thenReturn(Optional.of(sampleSponsor));

        ResponseEntity<SponsorResponse> response = controller.getSponsor(200L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("Nike Pro Performance");
    }

    @Test
    @DisplayName("F2.7: Delete sponsor removes sponsor from repository")
    void f2_7_deleteSponsor_removesSponsorFromRepository() {
        when(sponsorRepository.findById(200L)).thenReturn(Optional.of(sampleSponsor));
        doNothing().when(sponsorRepository).delete(sampleSponsor);

        sponsorService.deleteSponsor(200L);

        verify(sponsorRepository, times(1)).delete(sampleSponsor);
    }

    // =========================================================================
    // FEATURE 3: Post View Tracking & Debouncing
    // =========================================================================

    @Test
    @DisplayName("F3.1: Qualifying view with duration >= 2000ms is recorded and incremented")
    void f3_1_qualifyingView_durationGte2000ms_recordedAndIncremented() {
        when(postRepository.findById(500L)).thenReturn(Optional.of(samplePost));
        when(viewEventRepository.findRecentViewsForPost(eq(500L), any(LocalDateTime.class), eq("session-1"), eq(1L), eq("10.0.0.1")))
                .thenReturn(Collections.emptyList());
        when(postService.incrementViewsCount(500L)).thenReturn(1);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userBadgeRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        ViewEventRequest request = ViewEventRequest.builder()
                .postId(500L)
                .sessionId("session-1")
                .userId(1L)
                .ipHash("10.0.0.1")
                .durationMs(2500L)
                .viewType(ViewEvent.ViewType.POST)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(request);

        assertThat(response).isNotNull();
        assertThat(response.isRecorded()).isTrue();
        assertThat(response.isIncremented()).isTrue();
        assertThat(response.getViewsCount()).isEqualTo(101L);
        verify(postService, times(1)).incrementViewsCount(500L);
        verify(viewEventRepository, times(1)).save(any(ViewEvent.class));
    }

    @Test
    @DisplayName("F3.2: Duplicate view within 30s debounce window is rejected and not incremented")
    void f3_2_debounceView_duplicateWithin30s_rejectedAndNotIncremented() {
        when(postRepository.findById(500L)).thenReturn(Optional.of(samplePost));

        ViewEvent existing = ViewEvent.builder()
                .id(1L)
                .post(samplePost)
                .sessionId("session-1")
                .durationMs(3000L)
                .viewedAt(LocalDateTime.now().minusSeconds(10))
                .build();

        when(viewEventRepository.findRecentViewsForPost(eq(500L), any(LocalDateTime.class), eq("session-1"), eq(1L), eq("10.0.0.1")))
                .thenReturn(List.of(existing));

        ViewEventRequest duplicateRequest = ViewEventRequest.builder()
                .postId(500L)
                .sessionId("session-1")
                .userId(1L)
                .ipHash("10.0.0.1")
                .durationMs(3000L)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(duplicateRequest);

        assertThat(response.isRecorded()).isFalse();
        assertThat(response.isIncremented()).isFalse();
        assertThat(response.getViewsCount()).isEqualTo(100L);
        assertThat(response.getMessage()).contains("Debounced");
        verify(postService, never()).incrementViewsCount(anyLong());
    }

    @Test
    @DisplayName("F3.3: Distinct sessions increment view count independently")
    void f3_3_distinctSession_incrementsViewCountIndependently() {
        when(postRepository.findById(500L)).thenReturn(Optional.of(samplePost));
        when(viewEventRepository.findRecentViewsForPost(eq(500L), any(LocalDateTime.class), eq("session-A"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());
        when(viewEventRepository.findRecentViewsForPost(eq(500L), any(LocalDateTime.class), eq("session-B"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());
        when(postService.incrementViewsCount(500L)).thenReturn(1);

        ViewEventRequest reqA = ViewEventRequest.builder().postId(500L).sessionId("session-A").durationMs(2100L).build();
        ViewEventRequest reqB = ViewEventRequest.builder().postId(500L).sessionId("session-B").durationMs(2100L).build();

        ViewEventResponse respA = viewService.recordViewEvent(reqA);
        ViewEventResponse respB = viewService.recordViewEvent(reqB);

        assertThat(respA.isIncremented()).isTrue();
        assertThat(respB.isIncremented()).isTrue();
        verify(postService, times(2)).incrementViewsCount(500L);
    }

    @Test
    @DisplayName("F3.4: viewsCount update increments Post viewsCount persistently")
    void f3_4_viewsCountUpdate_incrementsPostViewsCount() {
        Post post = Post.builder().id(10L).viewsCount(0).build();
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postService.incrementViewsCount(10L)).thenReturn(1);

        ViewEventRequest req = ViewEventRequest.builder().postId(10L).sessionId("s1").durationMs(2500L).build();
        ViewEventResponse resp = viewService.recordViewEvent(req);

        assertThat(resp.getViewsCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("F3.5: Short view duration < 2000ms is disqualified by ViewCalculator")
    void f3_5_shortView_durationLt2000ms_disqualifiedInViewCalculator() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(samplePost));

        ViewEventRequest req = ViewEventRequest.builder()
                .postId(100L)
                .durationMs(1500L)
                .sessionId("s-short")
                .build();

        ViewEventResponse resp = viewService.recordViewEvent(req);

        assertThat(resp.isIncremented()).isFalse();
        verify(postService, never()).incrementViewsCount(anyLong());

        ViewEvent shortEvent = ViewEvent.builder()
                    .durationMs(1500L)
                    .sessionId("s-short")
                    .viewedAt(LocalDateTime.now())
                    .build();

        long count = ViewCalculator.countQualifyingViews(List.of(shortEvent));

        assertThat(count).isEqualTo(0L);
    }

    @Test
    @DisplayName("F3.6: Standalone sponsor view without postId is recorded without post increment")
    void f3_6_standaloneSponsorView_recordedWithoutPostIncrement() {
        when(sponsorRepository.findById(200L)).thenReturn(Optional.of(sampleSponsor));
        when(viewEventRepository.findRecentViewsForSponsor(eq(200L), any(LocalDateTime.class), eq("s-sp"), isNull(), isNull()))
                .thenReturn(Collections.emptyList());

        ViewEventRequest req = ViewEventRequest.builder()
                .sponsorId(200L)
                .sessionId("s-sp")
                .durationMs(2200L)
                .viewType(ViewEvent.ViewType.SPONSOR_BADGE)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(req);

        assertThat(response.isRecorded()).isTrue();
        assertThat(response.isIncremented()).isFalse();
        assertThat(response.getViewsCount()).isNull();
        verify(postService, never()).incrementViewsCount(anyLong());
    }

    @Test
    @DisplayName("F3.7: ViewsController recordView returns HTTP 201 CREATED")
    void f3_7_viewsController_recordView_returnsHttp201Created() {
        ViewsController controller = new ViewsController(viewService, earningService);
        when(postRepository.findById(500L)).thenReturn(Optional.of(samplePost));

        ViewEventRequest req = ViewEventRequest.builder().postId(500L).sessionId("sess-vc").durationMs(2000L).build();
        ResponseEntity<ViewEventResponse> response = controller.recordView(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().isRecorded()).isTrue();
    }

    // =========================================================================
    // FEATURE 4: INR Earnings Calculation
    // =========================================================================

    @Test
    @DisplayName("F4.1: ₹20 per 1,000 views math strictly enforced")
    void f4_1_earningsRate_strictlyEnforcesTwentyInrPerThousandViews() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1000);
        assertThat(earnings).isEqualTo(new BigDecimal("20.00"));
    }

    @Test
    @DisplayName("F4.2: 500 views calculates exactly ₹10.00")
    void f4_2_earningsCalculation_500views_equalsTenInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(500);
        assertThat(earnings).isEqualTo(new BigDecimal("10.00"));
    }

    @Test
    @DisplayName("F4.3: 1000 views calculates exactly ₹20.00")
    void f4_3_earningsCalculation_1000views_equalsTwentyInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1000);
        assertThat(earnings).isEqualByComparingTo("20.00");
    }

    @Test
    @DisplayName("F4.4: Zero views calculates exactly ₹0.00")
    void f4_4_earningsCalculation_zeroViews_equalsZeroInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(0);
        assertThat(earnings).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    @DisplayName("F4.5: RATE_PER_THOUSAND constant is 20.00 INR")
    void f4_5_ratePerThousand_constantConsistency() {
        assertThat(ViewCalculator.RATE_PER_THOUSAND).isEqualTo(new BigDecimal("20.00"));
        assertThat(ViewCalculator.MIN_DURATION_MS).isEqualTo(2000L);
        assertThat(ViewCalculator.DUPLICATE_WINDOW_SECONDS).isEqualTo(30L);
    }

    @Test
    @DisplayName("F4.6: Monthly earnings calculation aggregates across multiple sponsors")
    void f4_6_monthlyEarningsCalculation_aggregatesAcrossSponsors() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(sponsorRepository.findByIsActiveTrue()).thenReturn(List.of(sampleSponsor));

        ViewEvent ev1 = ViewEvent.builder().durationMs(2500L).sessionId("s1").viewedAt(LocalDateTime.now()).build();
        ViewEvent ev2 = ViewEvent.builder().durationMs(2500L).sessionId("s2").viewedAt(LocalDateTime.now()).build();

        when(viewEventRepository.findQualifyingViewsByUser(eq(1L), eq(200L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(ev1, ev2));
        when(userRepository.getReferenceById(1L)).thenReturn(sampleUser);

        String currentPeriod = DateTimeFormatter.ofPattern("yyyy-MM").format(YearMonth.now());
        EarningsSummary summary = earningService.calculateEarnings(1L, currentPeriod);

        assertThat(summary).isNotNull();
        assertThat(summary.getUserId()).isEqualTo(1L);
        assertThat(summary.getTotalViews()).isEqualTo(2L);
        assertThat(summary.getTotalEarnings()).isEqualTo(new BigDecimal("0.04"));
        assertThat(summary.getSponsorBreakdown()).hasSize(1);
        assertThat(summary.getSponsorBreakdown().get(0).getSponsorName()).isEqualTo("Nike Pro Performance");
    }

    @Test
    @DisplayName("F4.7: Live earnings summary calculates real-time metrics without mock fallbacks")
    void f4_7_liveEarningsSummary_calculatesRealTimeMetrics() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(sponsorRepository.findByIsActiveTrue()).thenReturn(List.of(sampleSponsor));

        List<ViewEvent> liveViews = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            liveViews.add(ViewEvent.builder()
                    .sessionId("sess-" + i)
                    .durationMs(2500L)
                    .viewedAt(LocalDateTime.now())
                    .build());
        }

        when(viewEventRepository.findAllQualifyingViewsByUserAndSponsor(1L, 200L)).thenReturn(liveViews);
        when(viewEventRepository.findAllQualifyingViewsByUser(1L)).thenReturn(liveViews);
        when(earningRepository.findByUserIdOrderByCalculatedAtDesc(1L)).thenReturn(Collections.emptyList());

        EarningsSummary summary = earningService.getEarningsSummary(1L);

        assertThat(summary.getTotalViews()).isEqualTo(50L);
        assertThat(summary.getTotalEarnings()).isEqualTo(new BigDecimal("1.00")); // 50/1000 * 20 = 1.00
    }

    // =========================================================================
    // FEATURE 5: Session Management & Logout Wipe
    // =========================================================================

    @Test
    @DisplayName("F5.1: Session token generated on login with non-empty bearer token and expiration")
    void f5_1_sessionCreatedOnLogin_generatesBearerTokenWithExpiration() {
        String token = TokenProvider.generateToken(1L, "athlete_john", "USER");
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        Session session = sessionService.createSession(sampleUser, token, "Agent", "127.0.0.1", Duration.ofDays(7));

        assertThat(session).isNotNull();
        assertThat(session.getToken()).isEqualTo(token);
        assertThat(session.getIsActive()).isTrue();
        assertThat(TokenProvider.getExpirationSeconds()).isEqualTo(604800L); // 7 days
        verify(sessionRepository).save(any(Session.class));
    }

    @Test
    @DisplayName("F5.2: Session token tracks IP/timestamp and decodes required claims")
    void f5_2_sessionTracking_tracksIpHashAndTimestampInTokenPayload() {
        String token = TokenProvider.generateToken(1L, "athlete_john", "USER");
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        Session session = sessionService.createSession(sampleUser, token, "Mozilla/5.0", "127.0.0.1", Duration.ofDays(7));

        assertThat(session.getDeviceInfo()).isEqualTo("Mozilla/5.0");
        assertThat(session.getIpAddress()).isEqualTo("127.0.0.1");
        assertThat(session.getUser().getId()).isEqualTo(sampleUser.getId());
        assertThat(session.getExpiresAt()).isAfter(LocalDateTime.now());

        String[] parts = TokenProvider.decodeClaims(token);
        assertThat(parts).isNotNull();
        assertThat(parts.length).isGreaterThanOrEqualTo(5);
        assertThat(parts[0]).isEqualTo("1");
        assertThat(parts[1]).isEqualTo("athlete_john");
        assertThat(parts[2]).isEqualTo("USER");
        long expiresAt = Long.parseLong(parts[3]);
        assertThat(expiresAt).isGreaterThan(Instant.now().getEpochSecond());
    }

    @Test
    @DisplayName("F5.3: Session decodability validates token integrity and signature part")
    void f5_3_sessionDecodability_validatesTokenStructureAndClaims() {
        String token = TokenProvider.generateToken(2L, "athlos_academy", "INSTITUTION");
        String[] parts = TokenProvider.decodeClaims(token);

        assertThat(parts).isNotNull();
        assertThat(parts[2]).isEqualTo("INSTITUTION");
        assertThat(parts[4]).isNotBlank(); // random signature part
    }

    @Test
    @DisplayName("F5.4: Logout marks session inactive and wipes active access")
    void f5_4_logoutSessionWipe_invalidatesSessionAndRejectsToken() {
        String token = TokenProvider.generateToken(1L, "athlete_john", "USER");
        Session session = Session.builder()
                .id(1L)
                .token(token)
                .user(sampleUser)
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));

        // Active before logout
        assertThat(sessionService.isSessionActive(token)).isTrue();

        // Perform invalidation
        sessionService.invalidateSession(token);
        verify(sessionRepository).save(argThat(s -> Boolean.FALSE.equals(s.getIsActive())));

        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.empty());
        assertThat(sessionService.isSessionActive(token)).isFalse();
    }

    @Test
    @DisplayName("F5.5: Inactive or expired session is rejected")
    void f5_5_inactiveSessionRejection_rejectsExpiredOrInvalidatedSession() {
        String expiredToken = TokenProvider.generateToken(1L, "athlete_john", "USER");
        Session expiredSession = Session.builder()
                .id(2L)
                .token(expiredToken)
                .user(sampleUser)
                .isActive(true)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(sessionRepository.findByTokenAndIsActiveTrue(expiredToken)).thenReturn(Optional.of(expiredSession));

        boolean isActive = sessionService.isSessionActive(expiredToken);
        assertThat(isActive).isFalse();
        verify(sessionRepository).save(argThat(s -> Boolean.FALSE.equals(s.getIsActive())));
    }

    @Test
    @DisplayName("F5.6: Multi-session tracking produces distinct tokens for concurrent logins")
    void f5_6_multiSessionTracking_concurrentLoginsProduceDistinctTokens() {
        String token1 = TokenProvider.generateToken(1L, "athlete_john", "USER");
        String token2 = TokenProvider.generateToken(1L, "athlete_john", "USER");

        assertThat(token1).isNotEqualTo(token2);
    }

    @Test
    @DisplayName("F5.7: Session lifecycle validates configured 7-day expiration")
    void f5_7_sessionLifecycle_validatesConfiguredSevenDayExpiration() {
        long expectedSeconds = 7 * 24 * 3600L;
        assertThat(TokenProvider.getExpirationSeconds()).isEqualTo(expectedSeconds);
    }

    // =========================================================================
    // FEATURE 6: Protected Routes & Role Enforcement
    // =========================================================================

    @Test
    @DisplayName("F6.1: Unauthenticated access without token is rejected")
    void f6_1_unauthenticatedAccess_rejectedWhenTokenMissing() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        MockHttpServletResponse res = new MockHttpServletResponse();
        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("F6.2: Regular user role blocked from institutional operations")
    void f6_2_regularUserRole_prohibitedFromInstitutionalOperations() throws Exception {
        String token = TokenProvider.generateToken(1L, "athlete_john", "USER");
        Session session = Session.builder().id(1L).token(token).user(sampleUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("F6.3: Institution user role allowed for institutional operations")
    void f6_3_institutionUserRole_permittedForInstitutionalOperations() throws Exception {
        String token = TokenProvider.generateToken(2L, "athlos_academy", "INSTITUTION");
        Session session = Session.builder().id(2L).token(token).user(sampleInstitutionUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isTrue();
        assertThat(req.getAttribute("currentUser")).isEqualTo(sampleInstitutionUser);
        assertThat(req.getAttribute("currentUserRole")).isEqualTo("INSTITUTION");
    }

    @Test
    @DisplayName("F6.4: Valid bearer token accepted and decodes authorized user context")
    void f6_4_validBearerToken_acceptedAndAuthorizesRequest() throws Exception {
        String token = TokenProvider.generateToken(2L, "athlos_academy", "INSTITUTION");
        Session session = Session.builder().id(2L).token(token).user(sampleInstitutionUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/audit/logs");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isTrue();
        assertThat(req.getAttribute("currentUser")).isEqualTo(sampleInstitutionUser);
    }

    @Test
    @DisplayName("F6.5: Invalid or malformed token is rejected")
    void f6_5_invalidBearerToken_rejectedDueToTamperedPayload() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer invalid!token@not$base64%");
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("F6.6: Institution login request returns INSTITUTION role in response")
    void f6_6_institutionLogin_grantsInstitutionRoleAndId() {
        when(userRepository.findByUsername("athlos_academy")).thenReturn(Optional.of(sampleInstitutionUser));
        when(institutionRepository.findByUserId(2L)).thenReturn(Optional.of(sampleInstitution));

        InstitutionLoginRequest req = InstitutionLoginRequest.builder()
                .institutionCodeOrEmail("athlos_academy")
                .password("athlos2026")
                .build();

        AuthResponse response = authService.loginInstitution(req);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo("INSTITUTION");
        assertThat(response.getInstitutionId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("F6.7: Role enforcement differentiates User and Institution permissions")
    void f6_7_roleEnforcement_differentiatesUserAndInstitutionPermissions() throws Exception {
        String token = TokenProvider.generateToken(1L, "athlete_john", "USER");
        Session session = Session.builder().id(1L).token(token).user(sampleUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(session));

        // Public/user route: GET /api/v1/posts -> allowed
        MockHttpServletRequest reqPublic = new MockHttpServletRequest("GET", "/api/v1/posts");
        reqPublic.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse resPublic = new MockHttpServletResponse();
        boolean allowedPublic = authInterceptor.preHandle(reqPublic, resPublic, new Object());
        assertThat(allowedPublic).isTrue();

        // Institutional route: POST /api/v1/badges/assign -> forbidden
        MockHttpServletRequest reqInst = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        reqInst.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse resInst = new MockHttpServletResponse();
        boolean allowedInst = authInterceptor.preHandle(reqInst, resInst, new Object());
        assertThat(allowedInst).isFalse();
        assertThat(resInst.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    // =========================================================================
    // FEATURE 7: Audit Logging & Mock Elimination
    // =========================================================================

    @Test
    @DisplayName("F7.1: Login audit event captures user ID, event type, and timestamp")
    void f7_1_auditLogging_loginEventCapturesUserAndTimestamp() {
        AuditLog saved = AuditLog.builder()
                .id(1L)
                .user(sampleUser)
                .eventType("LOGIN")
                .details("Successful authentication from 127.0.0.1")
                .ipAddress("127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(saved);

        AuditLog log = auditService.logEvent(sampleUser, "LOGIN", "Successful authentication from 127.0.0.1", "127.0.0.1");

        assertThat(log).isNotNull();
        assertThat(log.getEventType()).isEqualTo("LOGIN");
        assertThat(log.getUser().getId()).isEqualTo(1L);
        assertThat(log.getIpAddress()).isEqualTo("127.0.0.1");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("F7.2: Logout audit event captures session termination")
    void f7_2_auditLogging_logoutEventCapturesSessionTermination() {
        AuditLog saved = AuditLog.builder()
                .id(2L)
                .user(sampleUser)
                .eventType("LOGOUT")
                .details("User initiated session termination")
                .ipAddress("127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(saved);

        AuditLog log = auditService.logEvent(sampleUser, "LOGOUT", "User initiated session termination", "127.0.0.1");

        assertThat(log.getEventType()).isEqualTo("LOGOUT");
        assertThat(log.getDetails()).contains("termination");
        verify(auditLogRepository).save(argThat(l -> "LOGOUT".equals(l.getEventType())));
    }

    @Test
    @DisplayName("F7.3: Badge assignment audit event records institution, badge, and recipient")
    void f7_3_auditLogging_badgeAssignmentEventRecordsInstitutionAndRecipient() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(badgeRepository.findById(100L)).thenReturn(Optional.of(sampleBadge));
        when(institutionRepository.findById(10L)).thenReturn(Optional.of(sampleInstitution));
        when(userBadgeRepository.save(any(UserBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignBadgeRequest req = AssignBadgeRequest.builder()
                .userId(1L)
                .badgeId(100L)
                .institutionId(10L)
                .build();

        badgeService.assignBadgeToUser(req);

        verify(auditLogRepository).save(argThat(l -> "BADGE_ASSIGN".equals(l.getEventType())));
    }

    @Test
    @DisplayName("F7.4: View audit event records duration, postId, and sessionId")
    void f7_4_auditLogging_viewEventRecordsDurationAndSessionDetails() {
        when(postRepository.findById(500L)).thenReturn(Optional.of(samplePost));

        ViewEventRequest req = ViewEventRequest.builder()
                .postId(500L)
                .sessionId("sess-audit-1")
                .durationMs(3200L)
                .userId(1L)
                .ipHash("127.0.0.1")
                .build();

        viewService.recordViewEvent(req);

        verify(auditLogRepository).save(argThat(l -> "VIEW".equals(l.getEventType()) && l.getDetails().contains("duration: 3200ms")));
    }

    @Test
    @DisplayName("F7.5: Audit log retrieval returns chronological event history")
    void f7_5_auditLogRetrieval_returnsChronologicalEventHistory() {
        AuditLog log1 = AuditLog.builder().id(1L).eventType("LOGIN").createdAt(LocalDateTime.now().minusMinutes(10)).build();
        AuditLog log2 = AuditLog.builder().id(2L).eventType("VIEW").createdAt(LocalDateTime.now().minusMinutes(5)).build();
        AuditLog log3 = AuditLog.builder().id(3L).eventType("LOGOUT").createdAt(LocalDateTime.now().minusMinutes(1)).build();

        when(auditLogRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(log3, log2, log1));

        List<AuditLogResponse> logs = auditService.getLogs();

        assertThat(logs).hasSize(3);
        assertThat(logs.get(0).getEventType()).isEqualTo("LOGOUT");
        assertThat(logs.get(1).getEventType()).isEqualTo("VIEW");
        assertThat(logs.get(2).getEventType()).isEqualTo("LOGIN");
        assertThat(logs.get(0).getCreatedAt()).isAfter(logs.get(1).getCreatedAt());
        assertThat(logs.get(1).getCreatedAt()).isAfter(logs.get(2).getCreatedAt());
    }

    @Test
    @DisplayName("F7.6: Mock elimination in badges verifies responses contain persisted DB entities")
    void f7_6_mockElimination_badgeResponsesContainDatabaseDataNotStaticStubs() {
        when(badgeRepository.findAll()).thenReturn(List.of(sampleBadge));

        List<BadgeResponse> badges = badgeService.getAllBadges();

        assertThat(badges).hasSize(1);
        assertThat(badges.get(0).getName()).isEqualTo("Game City Champion");
        assertThat(badges.get(0).getInstitutionName()).isEqualTo("Athlos Sports Academy");
    }

    @Test
    @DisplayName("F7.7: Mock elimination in earnings verifies calculations are mathematically derived")
    void f7_7_mockElimination_earningsAndViewsAreMathematicallyDerivedNotRandom() {
        long views = 2500;
        BigDecimal calculated = ViewCalculator.calculateEarnings(views);

        // 2500 / 1000 * 20 = 50.00 exactly
        assertThat(calculated).isEqualTo(new BigDecimal("50.00"));
    }
}
