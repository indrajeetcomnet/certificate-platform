package com.certificate.platform;

import com.certificate.platform.dto.PostResponse;
import com.certificate.platform.dto.ViewEventRequest;
import com.certificate.platform.dto.ViewEventResponse;
import com.certificate.platform.model.Post;
import com.certificate.platform.model.Sponsor;
import com.certificate.platform.model.User;
import com.certificate.platform.model.ViewEvent;
import com.certificate.platform.repository.*;
import com.certificate.platform.service.EarningService;
import com.certificate.platform.service.PostService;
import com.certificate.platform.service.ViewService;
import com.certificate.platform.util.ViewCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Milestone 2 Features Test Suite")
class Milestone2FeaturesTest {

    @Mock
    private ViewEventRepository viewEventRepository;
    @Mock
    private SponsorRepository sponsorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private PostService postService;
    @Mock
    private UserBadgeRepository userBadgeRepository;
    @Mock
    private SponsorBadgeRepository sponsorBadgeRepository;
    @Mock
    private EarningRepository earningRepository;

    @InjectMocks
    private ViewService viewService;

    private User sampleUser;
    private Post samplePost;
    private Sponsor sampleSponsor;

    @BeforeEach
    void setUp() {
        org.mockito.MockitoAnnotations.openMocks(this);
        sampleUser = User.builder()
                .id(10L)
                .username("athlete1")
                .displayName("Athlete One")
                .build();

        samplePost = Post.builder()
                .id(100L)
                .user(sampleUser)
                .content("Test championship run")
                .viewsCount(50)
                .build();

        sampleSponsor = Sponsor.builder()
                .id(5L)
                .name("Official Sponsor")
                .isActive(true)
                .build();
    }


    @Test
    @DisplayName("ViewCalculator: Earnings formula strictly enforces ₹20.00 per 1,000 qualifying views")
    void testViewCalculatorEarningsRate() {
        assertEquals(new BigDecimal("20.00"), ViewCalculator.calculateEarnings(1000));
        assertEquals(new BigDecimal("100.00"), ViewCalculator.calculateEarnings(5000));
        assertEquals(new BigDecimal("10.00"), ViewCalculator.calculateEarnings(500));
        assertEquals(new BigDecimal("2.00"), ViewCalculator.calculateEarnings(100));
        assertEquals(new BigDecimal("0.00"), ViewCalculator.calculateEarnings(0));
    }


    @Test
    @DisplayName("ViewCalculator: Deduplicates views from same sessionId within 30 seconds")
    void testViewCalculatorDebouncingBySession() {
        LocalDateTime baseTime = LocalDateTime.now();
        List<ViewEvent> events = new ArrayList<>();

        // 1st view: duration 2500ms -> qualifies
        events.add(ViewEvent.builder()
                .sessionId("session-abc")
                .viewedAt(baseTime)
                .durationMs(2500L)
                .build());

        // 2nd view: same session 10s later -> debounced/ignored
        events.add(ViewEvent.builder()
                .sessionId("session-abc")
                .viewedAt(baseTime.plusSeconds(10))
                .durationMs(3000L)
                .build());

        // 3rd view: same session 35s later -> qualifies
        events.add(ViewEvent.builder()
                .sessionId("session-abc")
                .viewedAt(baseTime.plusSeconds(35))
                .durationMs(2200L)
                .build());

        // 4th view: duration < 2000ms -> disqualified
        events.add(ViewEvent.builder()
                .sessionId("session-abc")
                .viewedAt(baseTime.plusSeconds(80))
                .durationMs(1500L)
                .build());

        long qualifyingCount = ViewCalculator.countQualifyingViews(events);
        assertEquals(2, qualifyingCount, "Should count exactly 2 qualifying views outside 30s window with >=2000ms");
    }


    @Test
    @DisplayName("ViewService: Debounces rapid write events within 30-second window and preserves view count")
    void testViewServiceDebouncing() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(samplePost));

        // Simulate existing view within 30s
        ViewEvent existingEvent = ViewEvent.builder()
                .id(1L)
                .post(samplePost)
                .sessionId("sess-123")
                .viewedAt(LocalDateTime.now().minusSeconds(10))
                .durationMs(2500L)
                .build();

        when(viewEventRepository.findRecentViewsForPost(eq(100L), any(LocalDateTime.class), eq("sess-123"), eq(10L), eq("127.0.0.1")))
                .thenReturn(List.of(existingEvent));

        ViewEventRequest request = ViewEventRequest.builder()
                .postId(100L)
                .sessionId("sess-123")
                .userId(10L)
                .ipHash("127.0.0.1")
                .durationMs(2500L)
                .viewType(ViewEvent.ViewType.POST)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(request);

        assertNotNull(response);
        assertFalse(response.isRecorded(), "Event should be debounced");
        assertFalse(response.isIncremented(), "Views count should not increment");
        assertEquals(50L, response.getViewsCount(), "Should reflect current un-incremented view count");
        verify(postService, never()).incrementViewsCount(anyLong());
        verify(viewEventRepository, never()).save(any(ViewEvent.class));
    }


    @Test
    @DisplayName("ViewService: Successfully increments and persists qualifying view outside debounce window")
    void testViewServiceQualifyingView() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(samplePost));
        when(viewEventRepository.findRecentViewsForPost(eq(100L), any(LocalDateTime.class), eq("sess-new"), eq(10L), eq("127.0.0.1")))
                .thenReturn(Collections.emptyList());
        when(postService.incrementViewsCount(100L)).thenReturn(1);
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userBadgeRepository.findByUserId(10L)).thenReturn(Collections.emptyList());

        ViewEventRequest request = ViewEventRequest.builder()
                .postId(100L)
                .sessionId("sess-new")
                .userId(10L)
                .ipHash("127.0.0.1")
                .durationMs(3000L)
                .viewType(ViewEvent.ViewType.POST)
                .build();

        ViewEventResponse response = viewService.recordViewEvent(request);

        assertNotNull(response);
        assertTrue(response.isRecorded(), "View should be recorded");
        assertTrue(response.isIncremented(), "Views count should be incremented");
        assertEquals(51L, response.getViewsCount(), "Views count should be incremented from 50 to 51");
        verify(postService, times(1)).incrementViewsCount(100L);
        verify(viewEventRepository, times(1)).save(any(ViewEvent.class));
    }


    @Test
    @DisplayName("ViewEventRequest & ViewEvent: Support organic posts with optional sponsorId")
    void testOrganicViewEventNullSponsor() {
        ViewEventRequest request = ViewEventRequest.builder()
                .postId(100L)
                .sponsorId(null) // Optional sponsorId for organic post views
                .sessionId("session-organic")
                .userId(10L)
                .durationMs(2200L)
                .viewType(ViewEvent.ViewType.POST)
                .build();

        assertNull(request.getSponsorId(), "Organic views have null sponsorId");
        assertEquals("session-organic", request.getSessionId());

        ViewEvent event = ViewEvent.builder()
                .post(samplePost)
                .sponsor(null)
                .sessionId(request.getSessionId())
                .viewType(request.getViewType())
                .durationMs(request.getDurationMs())
                .viewedAt(LocalDateTime.now())
                .build();

        assertNull(event.getSponsor(), "ViewEvent model allows null sponsor");
        assertEquals("session-organic", event.getSessionId());
    }
}
