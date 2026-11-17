package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserBadgeRepository userBadgeRepository;

    public UserProfileResponse getUserProfile(Long userId) {
        return getUserProfile(userId, null);
    }

    public UserProfileResponse getUserProfile(Long userId, Long requesterUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        List<UserBadge> userBadges = userBadgeRepository.findByUserId(userId);

        // Privacy protection: email is only visible to the user themselves or an admin
        String visibleEmail = (requesterUserId != null && requesterUserId.equals(userId)) ? user.getEmail() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(visibleEmail)
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .role(user.getRole())
                .badges(userBadges.stream()
                        .map(this::mapToUserBadgeResponse)
                        .collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()) {
            String sanitized = sanitizeText(request.getDisplayName().trim());
            user.setDisplayName(sanitized);
        }
        if (request.getAvatarUrl() != null) {
            String av = request.getAvatarUrl().trim();
            user.setAvatarUrl(av.isEmpty() ? null : av);
        } else {
            user.setAvatarUrl(null);
        }
        if (request.getBio() != null) {
            String sanitizedBio = sanitizeText(request.getBio().trim());
            user.setBio(sanitizedBio.isEmpty() ? null : sanitizedBio);
        } else {
            user.setBio(null);
        }

        user = userRepository.save(user);
        return getUserProfile(user.getId(), userId);
    }

    public List<UserProfileResponse> getAllUsers(String query) {
        List<User> users;
        if (query != null && !query.trim().isEmpty()) {
            String q = sanitizeText(query.trim().toLowerCase());
            if (q.length() > 50) q = q.substring(0, 50);
            final String filterQuery = q;
            users = userRepository.findAll().stream()
                    .filter(u -> (u.getUsername() != null && u.getUsername().toLowerCase().contains(filterQuery))
                            || (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(filterQuery))
                            || (u.getBio() != null && u.getBio().toLowerCase().contains(filterQuery)))
                    .collect(Collectors.toList());
        } else {
            users = userRepository.findAll();
        }

        // Zero-leakage: public user directory returns email as null
        return users.stream()
                .map(u -> getUserProfile(u.getId(), null))
                .collect(Collectors.toList());
    }

    private String sanitizeText(String input) {
        if (input == null) return null;
        return input.replace("<", "&lt;").replace(">", "&gt;");
    }

    private UserBadgeResponse mapToUserBadgeResponse(UserBadge ub) {
        return UserBadgeResponse.builder()
                .id(ub.getId())
                .badge(BadgeResponse.builder()
                        .id(ub.getBadge().getId())
                        .name(ub.getBadge().getName())
                        .rank(ub.getBadge().getRank())
                        .rankDisplay(getRankDisplay(ub.getBadge().getRank()))
                        .category(ub.getBadge().getCategory())
                        .iconUrl(ub.getBadge().getIconUrl())
                        .description(ub.getBadge().getDescription())
                        .institutionName(ub.getBadge().getInstitution() != null ? ub.getBadge().getInstitution().getName() : null)
                        .createdAt(ub.getBadge().getCreatedAt())
                        .build())
                .awardedAt(ub.getAwardedAt())
                .awardedByInstitutionName(ub.getAwardedBy() != null ? ub.getAwardedBy().getName() : null)
                .build();
    }

    private String getRankDisplay(Integer rank) {
        return switch (rank) {
            case 1 -> "Gold";
            case 2 -> "Silver";
            case 3 -> "Bronze";
            default -> "Rank " + rank;
        };
    }
}
