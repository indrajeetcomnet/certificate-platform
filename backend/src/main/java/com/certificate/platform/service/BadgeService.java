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
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }
        if (user == null && request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String clean = request.getUsername().trim().replaceFirst("^@", "");
            user = userRepository.findByUsername(clean).orElse(null);
        }
        if (user == null && request.getUserEmail() != null && !request.getUserEmail().trim().isEmpty()) {
            user = userRepository.findByEmail(request.getUserEmail().trim()).orElse(null);
        }

        if (user == null) {
            String identifier = request.getUserId() != null ? String.valueOf(request.getUserId())
                    : (request.getUsername() != null ? request.getUsername() : request.getUserEmail());
            throw new ResourceNotFoundException("User not found with identifier: " + identifier);
        }

        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge", request.getBadgeId()));

        // Return existing badge if already awarded to prevent duplicate inflation
        java.util.Optional<UserBadge> existing = userBadgeRepository.findByUserIdAndBadgeId(user.getId(), badge.getId());
        if (existing.isPresent()) {
            return mapToUserBadgeResponse(existing.get());
        }

        Institution awardedBy = null;
        if (request.getInstitutionId() != null) {
            awardedBy = institutionRepository.findById(request.getInstitutionId()).orElse(null);
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

    @Transactional
    public BulkAssignBadgeResponse assignBadgeBulk(BulkAssignBadgeRequest request) {
        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge", request.getBadgeId()));

        Institution awardedBy = null;
        if (request.getInstitutionId() != null) {
            awardedBy = institutionRepository.findById(request.getInstitutionId()).orElse(null);
        }

        java.util.Set<User> targetUsers = new java.util.LinkedHashSet<>();
        java.util.List<String> notFound = new java.util.ArrayList<>();

        if (request.getUserIds() != null) {
            for (Long uid : request.getUserIds()) {
                if (uid != null) {
                    userRepository.findById(uid).ifPresentOrElse(targetUsers::add, () -> notFound.add("ID:" + uid));
                }
            }
        }
        if (request.getUsernames() != null) {
            for (String un : request.getUsernames()) {
                if (un != null && !un.trim().isEmpty()) {
                    String clean = un.trim().replaceFirst("^@", "");
                    userRepository.findByUsername(clean).ifPresentOrElse(targetUsers::add, () -> notFound.add("@" + clean));
                }
            }
        }
        if (request.getEmails() != null) {
            for (String em : request.getEmails()) {
                if (em != null && !em.trim().isEmpty()) {
                    userRepository.findByEmail(em.trim()).ifPresentOrElse(targetUsers::add, () -> notFound.add(em.trim()));
                }
            }
        }

        int assignedCount = 0;
        int skippedCount = 0;
        java.util.List<String> assignedNames = new java.util.ArrayList<>();

        for (User u : targetUsers) {
            if (userBadgeRepository.existsByUserIdAndBadgeId(u.getId(), badge.getId())) {
                skippedCount++;
            } else {
                UserBadge ub = UserBadge.builder()
                        .user(u)
                        .badge(badge)
                        .awardedAt(LocalDateTime.now())
                        .awardedBy(awardedBy)
                        .build();
                userBadgeRepository.save(ub);
                assignedCount++;
                assignedNames.add(u.getDisplayName() != null ? u.getDisplayName() : u.getUsername());
            }
        }

        return BulkAssignBadgeResponse.builder()
                .badgeId(badge.getId())
                .badgeName(badge.getName())
                .assignedCount(assignedCount)
                .skippedCount(skippedCount)
                .assignedUsers(assignedNames)
                .notFoundIdentifiers(notFound)
                .build();
    }

    @Transactional
    public void revokeBadge(Long userBadgeId) {
        UserBadge ub = userBadgeRepository.findById(userBadgeId)
                .orElseThrow(() -> new ResourceNotFoundException("UserBadge", userBadgeId));
        userBadgeRepository.delete(ub);
        if (auditService != null) {
            auditService.logEvent(null, "BADGE_REVOKE", "Revoked badge assignment ID: " + userBadgeId, null);
        }
    }

    @Transactional
    public void revokeUserBadge(Long userId, Long badgeId) {
        userBadgeRepository.deleteByUserIdAndBadgeId(userId, badgeId);
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
