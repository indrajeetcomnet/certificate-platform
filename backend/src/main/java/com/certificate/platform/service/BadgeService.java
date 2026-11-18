package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final SponsorBadgeRepository sponsorBadgeRepository;
    private final AuditService auditService;

    // Backward-compatible constructor for existing tests
    public BadgeService(BadgeRepository badgeRepository,
                        UserBadgeRepository userBadgeRepository,
                        UserRepository userRepository,
                        InstitutionRepository institutionRepository,
                        SponsorBadgeRepository sponsorBadgeRepository) {
        this(badgeRepository, userBadgeRepository, userRepository, institutionRepository, sponsorBadgeRepository, null);
    }

    @Autowired
    public BadgeService(BadgeRepository badgeRepository,
                        UserBadgeRepository userBadgeRepository,
                        UserRepository userRepository,
                        InstitutionRepository institutionRepository,
                        SponsorBadgeRepository sponsorBadgeRepository,
                        @Autowired(required = false) AuditService auditService) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
        this.institutionRepository = institutionRepository;
        this.sponsorBadgeRepository = sponsorBadgeRepository;
        this.auditService = auditService;
    }

    @Transactional
    public BadgeResponse createBadge(CreateBadgeRequest request) {
        Badge badge = Badge.builder()
                .name(request.getName())
                .rank(request.getRank())
                .category(request.getCategory())
                .iconUrl(request.getIconUrl())
                .description(request.getDescription())
                .build();

        if (request.getInstitutionId() != null) {
            Institution institution = institutionRepository.findById(request.getInstitutionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Institution", request.getInstitutionId()));
            badge.setInstitution(institution);
        }

        badge = badgeRepository.save(badge);

        if (auditService != null) {
            User instUser = badge.getInstitution() != null ? badge.getInstitution().getUser() : null;
            auditService.logEvent(instUser, "BADGE_CREATE", "Created badge '" + badge.getName() + "' (rank " + badge.getRank() + ", ID: " + badge.getId() + ")", null);
        }

        return mapToResponse(badge);
    }

    public List<BadgeResponse> getAllBadges() {
        return badgeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserBadgeResponse assignBadgeToUser(AssignBadgeRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));
        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge", request.getBadgeId()));

        Institution awardedBy = null;
        if (request.getInstitutionId() != null) {
            awardedBy = institutionRepository.findById(request.getInstitutionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Institution", request.getInstitutionId()));
        }

        UserBadge userBadge = UserBadge.builder()
                .user(user)
                .badge(badge)
                .awardedAt(LocalDateTime.now())
                .awardedBy(awardedBy)
                .build();

        userBadge = userBadgeRepository.save(userBadge);

        if (auditService != null) {
            User instUser = awardedBy != null ? awardedBy.getUser() : null;
            auditService.logEvent(instUser, "BADGE_ASSIGN", "Assigned badge '" + badge.getName() + "' (ID: " + badge.getId() + ") to user '" + user.getUsername() + "' (ID: " + user.getId() + ")", null);
        }

        return mapToUserBadgeResponse(userBadge);
    }

    public List<UserBadgeResponse> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId).stream()
                .map(this::mapToUserBadgeResponse)
                .collect(Collectors.toList());
    }

    public List<SponsorBadgeResponse> getActiveSponsorsForBadge(Long badgeId) {
        badgeRepository.findById(badgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Badge", badgeId));

        return sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(badgeId).stream()
                .map(sb -> SponsorBadgeResponse.builder()
                        .id(sb.getId())
                        .sponsorId(sb.getSponsor().getId())
                        .sponsorName(sb.getSponsor().getName())
                        .sponsorLogoUrl(sb.getSponsor().getLogoUrl())
                        .sponsorBannerImageUrl(sb.getSponsor().getBannerImageUrl())
                        .sponsorWebsiteUrl(sb.getSponsor().getWebsiteUrl())
                        .badgeId(sb.getBadge().getId())
                        .badgeName(sb.getBadge().getName())
                        .priority(sb.getPriority())
                        .build())
                .collect(Collectors.toList());
    }

    public List<UserBadgeResponse> getUserBadgesWithSponsors(Long userId) {
        return getUserBadges(userId);
    }

    private BadgeResponse mapToResponse(Badge badge) {
        String rankDisplay = null;
        if (badge.getRank() != null) {
            switch (badge.getRank()) {
                case 1: rankDisplay = "Gold"; break;
                case 2: rankDisplay = "Silver"; break;
                case 3: rankDisplay = "Bronze"; break;
                default: rankDisplay = "Rank " + badge.getRank(); break;
            }
        }
        return BadgeResponse.builder()
                .id(badge.getId())
                .name(badge.getName())
                .rank(badge.getRank())
                .rankDisplay(rankDisplay)
                .category(badge.getCategory())
                .institutionName(badge.getInstitution() != null ? badge.getInstitution().getName() : null)
                .iconUrl(badge.getIconUrl())
                .description(badge.getDescription())
                .createdAt(badge.getCreatedAt())
                .build();
    }

    public List<UserBadgeResponse> getAllAwardedBadges() {
        return userBadgeRepository.findAll().stream()
                .map(this::mapToUserBadgeResponse)
                .collect(Collectors.toList());
    }

    private UserBadgeResponse mapToUserBadgeResponse(UserBadge ub) {
        return UserBadgeResponse.builder()
                .id(ub.getId())
                .badge(mapToResponse(ub.getBadge()))
                .awardedAt(ub.getAwardedAt())
                .awardedByInstitutionName(ub.getAwardedBy() != null ? ub.getAwardedBy().getName() : null)
                .userId(ub.getUser() != null ? ub.getUser().getId() : null)
                .username(ub.getUser() != null ? ub.getUser().getUsername() : null)
                .userDisplayName(ub.getUser() != null ? ub.getUser().getDisplayName() : null)
                .userAvatarUrl(ub.getUser() != null ? ub.getUser().getAvatarUrl() : null)
                .build();
    }
}
