package com.certificate.platform;

import com.certificate.platform.dto.*;
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
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tier 2: Boundary Value Analysis & Corner Case Tests
 * Validates edge conditions, exact thresholds, zero/negative inputs, extreme values,
 * and malformed data across all seven features.
 */
@DisplayName("Tier 2 - Boundary & Corner Case Test Suite")
@ExtendWith(MockitoExtension.class)
public class Tier2BoundaryCornerTest {

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
    private SessionService sessionService;
    private AuditService auditService;
    private AuthInterceptor authInterceptor;

    private User sampleUser;
    private Post samplePost;
    private Sponsor sampleSponsor;
    private Badge sampleBadge;

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

        sampleUser = User.builder().id(10L).username("boundary_user").build();
        samplePost = Post.builder().id(100L).user(sampleUser).viewsCount(0).build();
        sampleSponsor = Sponsor.builder().id(20L).name("Boundary Sponsor").isActive(true).build();
        sampleBadge = Badge.builder().id(30L).name("Boundary Badge").rank(1).build();
    }

    // =========================================================================
    // FEATURE 1: Badge Creation & Assignment Boundaries
    // =========================================================================

    @Test
    @DisplayName("B1.1: Exact rank boundaries: Rank 1=Gold, Rank 2=Silver, Rank 3=Bronze")
    void b1_1_exactRankBoundary_rank1Rank2Rank3DisplayMapping() {
        Badge b1 = Badge.builder().id(1L).name("B1").rank(1).build();
        Badge b2 = Badge.builder().id(2L).name("B2").rank(2).build();
        Badge b3 = Badge.builder().id(3L).name("B3").rank(3).build();

        when(badgeRepository.findAll()).thenReturn(List.of(b1, b2, b3));

        List<BadgeResponse> responses = badgeService.getAllBadges();

        assertThat(responses.get(0).getRankDisplay()).isEqualTo("Gold");
        assertThat(responses.get(1).getRankDisplay()).isEqualTo("Silver");
        assertThat(responses.get(2).getRankDisplay()).isEqualTo("Bronze");
    }

    @Test
    @DisplayName("B1.2: Extreme high rank boundary: Rank 999 displays 'Rank 999'")
    void b1_2_extremeRank_rank999MapsToGenericRankDisplay() {
        Badge b999 = Badge.builder().id(999L).name("High Rank").rank(999).build();
        when(badgeRepository.findAll()).thenReturn(List.of(b999));

        List<BadgeResponse> responses = badgeService.getAllBadges();

        assertThat(responses.get(0).getRankDisplay()).isEqualTo("Rank 999");
    }

    @Test
    @DisplayName("B1.3: Boundary strings: Empty and max length description handled gracefully")
    void b1_3_boundaryStrings_emptyAndMaxDescriptionHandling() {
        String maxDesc = "A".repeat(4000);
        CreateBadgeRequest reqEmpty = CreateBadgeRequest.builder().name("Empty Desc").rank(1).description("").build();
        CreateBadgeRequest reqMax = CreateBadgeRequest.builder().name("Max Desc").rank(1).description(maxDesc).build();

        when(badgeRepository.save(any(Badge.class))).thenAnswer(inv -> inv.getArgument(0));

        BadgeResponse respEmpty = badgeService.createBadge(reqEmpty);
        BadgeResponse respMax = badgeService.createBadge(reqMax);

        assertThat(respEmpty.getDescription()).isEqualTo("");
        assertThat(respMax.getDescription()).hasSize(4000);
    }

    @Test
    @DisplayName("B1.4: Non-existent badgeId throws ResourceNotFoundException on getActiveSponsors")
    void b1_4_nonExistentBadgeId_throwsResourceNotFoundException() {
        when(badgeRepository.findById(9999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> badgeService.getActiveSponsorsForBadge(9999L));
    }

    @Test
    @DisplayName("B1.5: Non-existent userId throws ResourceNotFoundException on assignment")
    void b1_5_nonExistentUserId_throwsResourceNotFoundExceptionOnAssignment() {
        when(userRepository.findById(8888L)).thenReturn(Optional.empty());

        AssignBadgeRequest req = AssignBadgeRequest.builder().userId(8888L).badgeId(30L).build();
        assertThrows(ResourceNotFoundException.class, () -> badgeService.assignBadgeToUser(req));
    }

    // =========================================================================
    // FEATURE 2: Sponsor Linking Boundaries
    // =========================================================================

    @Test
    @DisplayName("B2.1: Priority boundaries: Zero, negative, and maximum integer priority")
    void b2_1_priorityBoundary_zeroNegativeAndMaxIntegerPriority() {
        when(sponsorRepository.findById(20L)).thenReturn(Optional.of(sampleSponsor));
        when(badgeRepository.findById(30L)).thenReturn(Optional.of(sampleBadge));
        when(sponsorBadgeRepository.save(any(SponsorBadge.class))).thenAnswer(inv -> inv.getArgument(0));

        LinkBadgeRequest reqZero = LinkBadgeRequest.builder().badgeId(30L).priority(0).build();
        LinkBadgeRequest reqNeg = LinkBadgeRequest.builder().badgeId(30L).priority(-10).build();
        LinkBadgeRequest reqMax = LinkBadgeRequest.builder().badgeId(30L).priority(Integer.MAX_VALUE).build();

        SponsorBadgeResponse rZero = sponsorService.linkBadge(20L, reqZero);
        SponsorBadgeResponse rNeg = sponsorService.linkBadge(20L, reqNeg);
        SponsorBadgeResponse rMax = sponsorService.linkBadge(20L, reqMax);

        assertThat(rZero.getPriority()).isEqualTo(0);
        assertThat(rNeg.getPriority()).isEqualTo(-10);
        assertThat(rMax.getPriority()).isEqualTo(Integer.MAX_VALUE);
    }

    @Test
    @DisplayName("B2.2: Inactive sponsor excluded from active sponsor badges query")
    void b2_2_inactiveSponsor_doesNotAppearInActiveSponsorsQuery() {
        when(sponsorBadgeRepository.findBySponsorIdAndIsActiveTrue(20L)).thenReturn(Collections.emptyList());

        List<SponsorBadgeResponse> list = sponsorService.getActiveSponsorBadges(20L);

        assertThat(list).isEmpty();
    }

    @Test
    @DisplayName("B2.3: Non-existent sponsorId throws ResourceNotFoundException")
    void b2_3_nonExistentSponsorId_throwsResourceNotFoundException() {
        when(sponsorRepository.findById(9999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sponsorService.getSponsor(9999L));
    }

    @Test
    @DisplayName("B2.4: Non-existent badgeId on link throws ResourceNotFoundException")
    void b2_4_nonExistentBadgeIdOnLink_throwsResourceNotFoundException() {
        when(sponsorRepository.findById(20L)).thenReturn(Optional.of(sampleSponsor));
        when(badgeRepository.findById(9999L)).thenReturn(Optional.empty());

        LinkBadgeRequest req = LinkBadgeRequest.builder().badgeId(9999L).priority(1).build();
        assertThrows(ResourceNotFoundException.class, () -> sponsorService.linkBadge(20L, req));
    }

    @Test
    @DisplayName("B2.5: Boundary strings: Special characters and unicode in sponsor details")
    void b2_5_boundaryStrings_whitespaceAndSpecialCharactersInSponsorName() {
        String specialName = "Sponsor & Co. #1 <Sport™> ⚡";
        CreateSponsorRequest req = CreateSponsorRequest.builder().name(specialName).isActive(true).build();
        when(sponsorRepository.save(any(Sponsor.class))).thenAnswer(inv -> inv.getArgument(0));

        SponsorResponse resp = sponsorService.createSponsor(req);

        assertThat(resp.getName()).isEqualTo(specialName);
    }

    // =========================================================================
    // FEATURE 3: View Tracking & Debouncing Boundaries
    // =========================================================================

    @Test
    @DisplayName("B3.1: Exact duration threshold: 1999ms disqualified vs 2000ms qualifies")
    void b3_1_exactDurationThreshold_1999msDisqualified_2000msQualifies() {
        ViewEvent e1999 = ViewEvent.builder().sessionId("s1").durationMs(1999L).viewedAt(LocalDateTime.now()).build();
        ViewEvent e2000 = ViewEvent.builder().sessionId("s2").durationMs(2000L).viewedAt(LocalDateTime.now()).build();

        long count1999 = ViewCalculator.countQualifyingViews(List.of(e1999));
        long count2000 = ViewCalculator.countQualifyingViews(List.of(e2000));

        assertThat(count1999).isEqualTo(0L);
        assertThat(count2000).isEqualTo(1L);
    }

    @Test
    @DisplayName("B3.2: Exact debounce window: View at 29s debounced vs view at 31s qualifies")
    void b3_2_exactDebounceWindow_29sDisqualified_31sQualifies() {
        LocalDateTime t0 = LocalDateTime.now();
        ViewEvent vInitial = ViewEvent.builder().sessionId("sess-win").durationMs(2500L).viewedAt(t0).build();
        ViewEvent vAt29s = ViewEvent.builder().sessionId("sess-win").durationMs(2500L).viewedAt(t0.plusSeconds(29)).build();
        ViewEvent vAt31s = ViewEvent.builder().sessionId("sess-win").durationMs(2500L).viewedAt(t0.plusSeconds(31)).build();

        long countAt29 = ViewCalculator.countQualifyingViews(List.of(vInitial, vAt29s));
        assertThat(countAt29).isEqualTo(1L);

        long countAt31 = ViewCalculator.countQualifyingViews(List.of(vInitial, vAt31s));
        assertThat(countAt31).isEqualTo(2L);
    }

    @Test
    @DisplayName("B3.3: Burst concurrency: Rapid consecutive requests from same session yield only 1 qualifying view")
    void b3_3_burstConcurrency_rapidConsecutiveRequestsFromSameSession_onlyOneQualifies() {
        LocalDateTime now = LocalDateTime.now();
        List<ViewEvent> burst = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            burst.add(ViewEvent.builder()
                    .sessionId("rapid-session")
                    .durationMs(2500L)
                    .viewedAt(now.plusNanos(i * 100_000_000L))
                    .build());
        }

        long qualifying = ViewCalculator.countQualifyingViews(burst);
        assertThat(qualifying).isEqualTo(1L);
    }

    @Test
    @DisplayName("B3.4: Null or empty session and IP allows independent anonymous views")
    void b3_4_nullSessionIdAndNullIpHash_anonymousViewsAllowed() {
        ViewEvent anon1 = ViewEvent.builder().sessionId(null).ipHash(null).durationMs(2200L).viewedAt(LocalDateTime.now()).build();
        ViewEvent anon2 = ViewEvent.builder().sessionId("").ipHash("").durationMs(2200L).viewedAt(LocalDateTime.now()).build();

        long count = ViewCalculator.countQualifyingViews(List.of(anon1, anon2));
        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("B3.5: Whitespace session ID is trimmed and handled safely")
    void b3_5_whitespaceSessionId_treatedAsEmptySessionIdentifier() {
        ViewEvent v = ViewEvent.builder().sessionId("   ").ipHash(null).durationMs(2500L).viewedAt(LocalDateTime.now()).build();
        long count = ViewCalculator.countQualifyingViews(List.of(v));
        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("B3.6: Non-existent postId throws ResourceNotFoundException on recordViewEvent")
    void b3_6_nonExistentPostId_throwsResourceNotFoundException() {
        when(postRepository.findById(9999L)).thenReturn(Optional.empty());

        ViewEventRequest req = ViewEventRequest.builder().postId(9999L).durationMs(2500L).build();
        assertThrows(ResourceNotFoundException.class, () -> viewService.recordViewEvent(req));
    }

    // =========================================================================
    // FEATURE 4: INR Earnings Calculation Boundaries
    // =========================================================================

    @Test
    @DisplayName("B4.1: Fractional earnings: 1 view = ₹0.02")
    void b4_1_fractionalViews_1view_equalsTwoPaise_zeroPointZeroTwoInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1);
        assertThat(earnings).isEqualTo(new BigDecimal("0.02"));
    }

    @Test
    @DisplayName("B4.2: Fractional earnings: 1,225 views = ₹24.50")
    void b4_2_fractionalViews_1225views_equalsTwentyFourPointFiftyInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1225);
        assertThat(earnings).isEqualTo(new BigDecimal("24.50"));
    }

    @Test
    @DisplayName("B4.3: Odd view counts: 999 views = ₹19.98 (HALF_UP rounding)")
    void b4_3_oddViews_999views_calculatesAccurateHalfUpRounding() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(999);
        assertThat(earnings).isEqualTo(new BigDecimal("19.98"));
    }

    @Test
    @DisplayName("B4.4: Negative views count returns ₹0.00")
    void b4_4_negativeViews_returnsZeroInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(-100);
        assertThat(earnings).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    @DisplayName("B4.5: Large view count: 1,000,000 views = ₹20,000.00")
    void b4_5_largeViewCount_oneMillionViews_equalsTwentyThousandInr() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1_000_000);
        assertThat(earnings).isEqualTo(new BigDecimal("20000.00"));
    }

    @Test
    @DisplayName("B4.6: Extreme view count: 1 Billion views maintains exact BigDecimal precision")
    void b4_6_extremeLargeViews_billionViews_maintainsPrecisionWithoutOverflow() {
        BigDecimal earnings = ViewCalculator.calculateEarnings(1_000_000_000L);
        assertThat(earnings).isEqualTo(new BigDecimal("20000000.00"));
    }

    // =========================================================================
    // FEATURE 5: Session Management Boundaries
    // =========================================================================

    @Test
    @DisplayName("B5.1: Expired token boundary: EpochNow minus 1 second is expired")
    void b5_1_expiredTokenBoundary_exactExpiryEpochMinus1Second_isExpired() {
        long expiredTimestamp = Instant.now().getEpochSecond() - 1;
        String payload = "1:user:USER:" + expiredTimestamp + ":rand";
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes());

        Session expiredSession = Session.builder()
                .id(1L)
                .token(token)
                .user(sampleUser)
                .isActive(true)
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(expiredSession));

        boolean isActive = sessionService.isSessionActive(token);
        assertThat(isActive).isFalse();
        verify(sessionRepository).save(argThat(s -> Boolean.FALSE.equals(s.getIsActive())));
    }

    @Test
    @DisplayName("B5.2: Valid token boundary: EpochNow plus 10 seconds is active")
    void b5_2_tokenNotExpiredBoundary_exactExpiryEpochPlus10Seconds_isValid() {
        long futureTimestamp = Instant.now().getEpochSecond() + 10;
        String payload = "1:user:USER:" + futureTimestamp + ":rand";
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes());

        Session activeSession = Session.builder()
                .id(2L)
                .token(token)
                .user(sampleUser)
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusSeconds(10))
                .build();
        when(sessionRepository.findByTokenAndIsActiveTrue(token)).thenReturn(Optional.of(activeSession));

        boolean isActive = sessionService.isSessionActive(token);
        assertThat(isActive).isTrue();
    }

    @Test
    @DisplayName("B5.3: Malformed token: Missing colons / fewer than 5 segments rejected")
    void b5_3_malformedToken_missingColonDelimiters_rejected() throws Exception {
        String invalidPayload = "user-without-delimiter";
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(invalidPayload.getBytes());

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("B5.4: Malformed token: Non-Base64 characters trigger IllegalArgumentException")
    void b5_4_malformedToken_nonBase64Characters_rejected() throws Exception {
        String nonBase64 = "###not-valid-base64-string$$$";

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + nonBase64);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("B5.5: Auth header boundary: Null, empty, or whitespace header rejected")
    void b5_5_tokenHeaderBoundary_nullEmptyOrBearerWithoutToken_rejected() throws Exception {
        List<String> badHeaders = Arrays.asList(null, "", "   ", "Bearer", "Bearer ", "Basic 1234");

        for (String header : badHeaders) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
            if (header != null) {
                req.addHeader("Authorization", header);
            }
            MockHttpServletResponse res = new MockHttpServletResponse();

            boolean allowed = authInterceptor.preHandle(req, res, new Object());

            assertThat(allowed).as("Header '" + header + "' must be rejected").isFalse();
            assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        }
    }

    // =========================================================================
    // FEATURE 6: Protected Routes & Role Boundaries
    // =========================================================================

    @Test
    @DisplayName("B6.1: Token tampering: Modified signature random part detected")
    void b6_1_tokenTampering_modifiedSignature_detectedAndRejected() throws Exception {
        String genuineToken = TokenProvider.generateToken(1L, "user1", "USER");
        String decoded = new String(Base64.getUrlDecoder().decode(genuineToken));
        String[] parts = decoded.split(":");

        String tamperedPayload = parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + parts[3] + ":tampered_signature";
        String tamperedToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tamperedPayload.getBytes());

        when(sessionRepository.findByTokenAndIsActiveTrue(tamperedToken)).thenReturn(Optional.empty());

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + tamperedToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("B6.2: Token tampering: Altering role from USER to INSTITUTION detected")
    void b6_2_tokenTampering_alteredRoleFromUserToInstitution_rejected() throws Exception {
        String originalToken = TokenProvider.generateToken(10L, "regular_user", "USER");
        String decoded = new String(Base64.getUrlDecoder().decode(originalToken));
        String[] parts = decoded.split(":");

        String forgedPayload = parts[0] + ":" + parts[1] + ":INSTITUTION:" + parts[3] + ":" + parts[4];
        String forgedToken = Base64.getUrlEncoder().withoutPadding().encodeToString(forgedPayload.getBytes());

        // Forged token is not in active session store or user in DB is regular USER
        when(sessionRepository.findByTokenAndIsActiveTrue(forgedToken)).thenReturn(Optional.empty());

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + forgedToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isIn(HttpStatus.UNAUTHORIZED.value(), HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("B6.3: Role claims are case-sensitive")
    void b6_3_caseSensitivity_roleClaimsCaseSensitivityValidation() throws Exception {
        // Token has lowercase "institution" role claim
        long futureTimestamp = Instant.now().getEpochSecond() + 3600;
        String payload = "10:boundary_user:institution:" + futureTimestamp + ":randomsig";
        String lowercaseRoleToken = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes());

        User instUser = User.builder().id(10L).username("boundary_user").role(User.Role.INSTITUTION).build();
        Session session = Session.builder().id(1L).token(lowercaseRoleToken).user(instUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(1)).build();
        when(sessionRepository.findByToken(lowercaseRoleToken)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(lowercaseRoleToken)).thenReturn(Optional.of(session));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + lowercaseRoleToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("B6.4: Whitespace padding in Bearer header is safely trimmed")
    void b6_4_whitespacePaddingInAuthHeader_trimmedAndEvaluated() throws Exception {
        User instUser = User.builder().id(10L).username("boundary_user").role(User.Role.INSTITUTION).build();
        String genuineToken = TokenProvider.generateToken(10L, "boundary_user", "INSTITUTION");
        Session session = Session.builder().id(1L).token(genuineToken).user(instUser).isActive(true).expiresAt(LocalDateTime.now().plusDays(1)).build();
        when(sessionRepository.findByToken(genuineToken)).thenReturn(Optional.of(session));
        when(sessionRepository.findByTokenAndIsActiveTrue(genuineToken)).thenReturn(Optional.of(session));

        String rawHeader = "Bearer    " + genuineToken + "    ";
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", rawHeader);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isTrue();
        assertThat(req.getAttribute("currentUser")).isEqualTo(instUser);
    }

    @Test
    @DisplayName("B6.5: Non-numeric userId in token payload triggers parsing error")
    void b6_5_nonNumericUserIdInToken_rejectedSafely() throws Exception {
        String payload = "bad_user_id:user:USER:9999999999:rand";
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes());

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/badges/assign");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        boolean allowed = authInterceptor.preHandle(req, res, new Object());

        assertThat(allowed).isFalse();
        assertThat(res.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    // =========================================================================
    // FEATURE 7: Audit Logging Boundaries
    // =========================================================================

    @Test
    @DisplayName("B7.1: Empty details string in audit record handled without NPE")
    void b7_1_auditLogBoundary_emptyDetailsField_handledWithoutNPE() {
        AuditLog saved = AuditLog.builder().id(1L).user(sampleUser).eventType("VIEW").details("").build();
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(saved);

        AuditLog log = auditService.logEvent(sampleUser, "VIEW", "", "127.0.0.1");

        assertThat(log).isNotNull();
        assertThat(log.getDetails()).isEqualTo("");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("B7.2: Large payload in details string persists safely")
    void b7_2_auditLogBoundary_maximumPayloadSizeDetails_persistedSafely() {
        String largePayload = "X".repeat(5000);
        AuditLog saved = AuditLog.builder().id(2L).user(sampleUser).eventType("SECURITY_ALERT").details(largePayload).build();
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(saved);

        AuditLog log = auditService.logEvent(sampleUser, "SECURITY_ALERT", largePayload, "127.0.0.1");

        assertThat(log).isNotNull();
        assertThat(log.getDetails().length()).isEqualTo(5000);
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("B7.3: Null eventType validation throws or is detected")
    void b7_3_auditLogBoundary_nullEventType_validationCheck() {
        assertThrows(IllegalArgumentException.class, () ->
                auditService.logEvent(sampleUser, null, "details", "127.0.0.1")
        );
        assertThrows(IllegalArgumentException.class, () ->
                auditService.logEvent(sampleUser, "   ", "details", "127.0.0.1")
        );
    }

    @Test
    @DisplayName("B7.4: Mock elimination: Zero views user returns ₹0.00 without mock fallback")
    void b7_4_mockEliminationBoundary_zeroViewsReturnsZeroEarningsWithoutMockFallback() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(sponsorRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());
        when(viewEventRepository.findAllQualifyingViewsByUser(10L)).thenReturn(Collections.emptyList());
        when(earningRepository.findByUserIdOrderByCalculatedAtDesc(10L)).thenReturn(Collections.emptyList());

        EarningsSummary summary = earningService.getEarningsSummary(10L);

        assertThat(summary.getTotalViews()).isEqualTo(0L);
        assertThat(summary.getTotalEarnings()).isEqualTo(new BigDecimal("0.00"));
        assertThat(summary.getSponsorBreakdown()).isEmpty();
    }

    @Test
    @DisplayName("B7.5: Mock elimination: User with no badges returns empty list, not mock badges")
    void b7_5_mockEliminationBoundary_userWithNoBadgesReturnsEmptyListNotMockBadges() {
        when(userBadgeRepository.findByUserId(10L)).thenReturn(Collections.emptyList());

        List<UserBadgeResponse> badges = badgeService.getUserBadges(10L);

        assertThat(badges).isEmpty();
    }
}
