package com.certificate.platform.service;

import com.certificate.platform.dto.ViewEventRequest;
import com.certificate.platform.dto.ViewEventResponse;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import com.certificate.platform.util.ViewCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ViewService {

    private final ViewEventRepository viewEventRepository;
    private final SponsorRepository sponsorRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final UserBadgeRepository userBadgeRepository;
    private final SponsorBadgeRepository sponsorBadgeRepository;
    private final AuditService auditService;

    // Backward-compatible constructor for existing tests
    public ViewService(ViewEventRepository viewEventRepository,
                       SponsorRepository sponsorRepository,
                       UserRepository userRepository,
                       PostRepository postRepository,
                       PostService postService,
                       UserBadgeRepository userBadgeRepository,
                       SponsorBadgeRepository sponsorBadgeRepository) {
        this(viewEventRepository, sponsorRepository, userRepository, postRepository, postService,
                userBadgeRepository, sponsorBadgeRepository, null);
    }

    @Autowired
    public ViewService(ViewEventRepository viewEventRepository,
                       SponsorRepository sponsorRepository,
                       UserRepository userRepository,
                       PostRepository postRepository,
                       PostService postService,
                       UserBadgeRepository userBadgeRepository,
                       SponsorBadgeRepository sponsorBadgeRepository,
                       @Autowired(required = false) AuditService auditService) {
        this.viewEventRepository = viewEventRepository;
        this.sponsorRepository = sponsorRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.postService = postService;
        this.userBadgeRepository = userBadgeRepository;
        this.sponsorBadgeRepository = sponsorBadgeRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ViewEventResponse recordViewEvent(ViewEventRequest request) {
        String sessionId = request.getSessionId() != null ? request.getSessionId().trim() : null;
        Long requestUserId = request.getUserId();
        String ipHash = request.getIpHash();
        LocalDateTime since = LocalDateTime.now().minusSeconds(30);

        if (request.getPostId() != null) {
            Post post = postRepository.findById(request.getPostId())
                    .orElseThrow(() -> new ResourceNotFoundException("Post", request.getPostId()));

            // 30-second write-time debouncing check
            boolean hasDebounceKey = (sessionId != null && !sessionId.trim().isEmpty())
                    || requestUserId != null
                    || (ipHash != null && !ipHash.trim().isEmpty());

            if (hasDebounceKey) {
                List<ViewEvent> recentViews = viewEventRepository.findRecentViewsForPost(
                        post.getId(), since, sessionId, requestUserId, ipHash);
                if (!recentViews.isEmpty()) {
                    long currentViews = post.getViewsCount() != null ? post.getViewsCount() : 0L;
                    return ViewEventResponse.builder()
                            .recorded(false)
                            .incremented(false)
                            .viewsCount(currentViews)
                            .message("Debounced: Duplicate view within 30-second window")
                            .build();
                }
            }

            // Check minimum view duration requirement (2000ms)
            if (request.getDurationMs() == null || request.getDurationMs() < ViewCalculator.MIN_DURATION_MS) {
                long currentViews = post.getViewsCount() != null ? post.getViewsCount() : 0L;
                return ViewEventResponse.builder()
                        .recorded(false)
                        .incremented(false)
                        .viewsCount(currentViews)
                        .message("Disqualified: View duration below minimum 2000ms threshold")
                        .build();
            }

            // Outside debounce window: qualify view & increment post viewsCount
            long initialViews = post.getViewsCount() != null ? post.getViewsCount() : 0L;
            postService.incrementViewsCount(post.getId());
            long updatedViews = initialViews + 1L;
            post.setViewsCount((int) updatedViews);

            // Resolve sponsor if specified, or author's linked active sponsor
            Sponsor sponsor = null;
            if (request.getSponsorId() != null) {
                sponsor = sponsorRepository.findById(request.getSponsorId()).orElse(null);
            }
            if (sponsor == null && post.getUser() != null) {
                List<UserBadge> authorBadges = userBadgeRepository.findByUserId(post.getUser().getId());
                if (authorBadges != null) {
                    for (UserBadge ub : authorBadges) {
                        if (ub.getBadge() != null) {
                            List<SponsorBadge> links = sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(ub.getBadge().getId());
                            if (links != null) {
                                for (SponsorBadge sb : links) {
                                    if (sb.getSponsor() != null && !Boolean.FALSE.equals(sb.getSponsor().getIsActive())) {
                                        sponsor = sb.getSponsor();
                                        break;
                                    }
                                }
                            }
                        }
                        if (sponsor != null) break;
                    }
                }
            }

            if (sponsor == null) {
                sponsor = sponsorRepository.findAll().stream().findFirst().orElse(null);
            }

            // Resolve user: preference for creator attribution or provided user
            User user = null;
            if (requestUserId != null) {
                user = userRepository.findById(requestUserId).orElse(null);
            }
            if (user == null && post.getUser() != null) {
                user = post.getUser();
            }

            if (sponsor == null) {
            sponsor = sponsorRepository.findAll().stream().findFirst().orElse(null);
        }

        ViewEvent viewEvent = ViewEvent.builder()
                    .sponsor(sponsor)
                    .user(user)
                    .post(post)
                    .sessionId(sessionId)
                    .viewType(request.getViewType() != null ? request.getViewType() : ViewEvent.ViewType.POST)
                    .viewedAt(LocalDateTime.now())
                    .durationMs(request.getDurationMs() != null ? request.getDurationMs() : 2000L)
                    .ipHash(ipHash)
                    .build();
            viewEventRepository.save(viewEvent);

            if (auditService != null) {
                auditService.logEvent(user, "VIEW", "Recorded qualifying view on post ID " + post.getId() + " (duration: " + viewEvent.getDurationMs() + "ms)", ipHash);
            }

            return ViewEventResponse.builder()
                    .recorded(true)
                    .incremented(true)
                    .viewsCount(updatedViews)
                    .message("View recorded and incremented")
                    .build();
        }

        // Standalone sponsor badge view (postId is null)
        Sponsor sponsor = null;
        if (request.getSponsorId() != null) {
            sponsor = sponsorRepository.findById(request.getSponsorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sponsor", request.getSponsorId()));

            boolean hasDebounceKey = (sessionId != null && !sessionId.trim().isEmpty())
                    || requestUserId != null
                    || (ipHash != null && !ipHash.trim().isEmpty());

            if (hasDebounceKey) {
                List<ViewEvent> recentViews = viewEventRepository.findRecentViewsForSponsor(
                        sponsor.getId(), since, sessionId, requestUserId, ipHash);
                if (!recentViews.isEmpty()) {
                    return ViewEventResponse.builder()
                            .recorded(false)
                            .incremented(false)
                            .viewsCount(null)
                            .message("Debounced: Duplicate sponsor view within 30-second window")
                            .build();
                }
            }
        }

        User user = null;
        if (requestUserId != null) {
            user = userRepository.findById(requestUserId).orElse(null);
        }

        if (sponsor == null) {
            sponsor = sponsorRepository.findAll().stream().findFirst().orElse(null);
        }

        ViewEvent viewEvent = ViewEvent.builder()
                .sponsor(sponsor)
                .user(user)
                .post(null)
                .sessionId(sessionId)
                .viewType(request.getViewType() != null ? request.getViewType() : ViewEvent.ViewType.SPONSOR_BADGE)
                .viewedAt(LocalDateTime.now())
                .durationMs(request.getDurationMs() != null ? request.getDurationMs() : 2000L)
                .ipHash(ipHash)
                .build();
        viewEventRepository.save(viewEvent);

        if (auditService != null) {
            Long sponsorId = sponsor != null ? sponsor.getId() : null;
            auditService.logEvent(user, "VIEW", "Recorded qualifying view on sponsor ID " + sponsorId + " (duration: " + viewEvent.getDurationMs() + "ms)", ipHash);
        }

        return ViewEventResponse.builder()
                .recorded(true)
                .incremented(false)
                .viewsCount(null)
                .message("Sponsor badge view recorded")
                .build();
    }

    public long countQualifyingViews(Long sponsorId, LocalDateTime start, LocalDateTime end) {
        List<ViewEvent> views = viewEventRepository.findQualifyingViews(sponsorId, start, end);
        return ViewCalculator.countQualifyingViews(views);
    }

    public long countQualifyingViewsByUser(Long userId, Long sponsorId, LocalDateTime start, LocalDateTime end) {
        List<ViewEvent> views = viewEventRepository.findQualifyingViewsByUser(userId, sponsorId, start, end);
        return ViewCalculator.countQualifyingViews(views);
    }
}
