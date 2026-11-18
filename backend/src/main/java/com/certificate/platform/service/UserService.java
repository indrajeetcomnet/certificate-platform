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
    private final MentorCreditRepository mentorCreditRepository;

    public UserProfileResponse getUserProfile(Long userId) {
        return getUserProfile(userId, null);
    }

    public UserProfileResponse getUserProfile(Long userId, Long requesterUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        List<UserBadge> userBadges = userBadgeRepository.findByUserId(userId);

        // Fetch credited mentors for this athlete
        List<MentorCredit> mentorCredits = mentorCreditRepository.findByAthleteId(userId);
        List<MentorSummaryResponse> creditedMentors = mentorCredits.stream()
                .map(mc -> MentorSummaryResponse.builder()
                        .id(mc.getMentor().getId())
                        .username(mc.getMentor().getUsername())
                        .displayName(mc.getMentor().getDisplayName() != null ? mc.getMentor().getDisplayName() : mc.getMentor().getUsername())
                        .avatarUrl(mc.getMentor().getAvatarUrl())
                        .bio(mc.getMentor().getBio())
                        .roleTitle(mc.getRoleTitle() != null ? mc.getRoleTitle() : "Coach / Mentor")
                        .creditedAt(mc.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        MentorSummaryResponse creditedMentor = creditedMentors.isEmpty() ? null : creditedMentors.get(0);

        // Fetch athletes who credited this user as their teacher/coach ("Applauded by")
        List<MentorCredit> applaudedCredits = mentorCreditRepository.findByMentorId(userId);
        List<MentorSummaryResponse> applaudedBy = applaudedCredits.stream()
                .map(mc -> MentorSummaryResponse.builder()
                        .id(mc.getAthlete().getId())
                        .username(mc.getAthlete().getUsername())
                        .displayName(mc.getAthlete().getDisplayName() != null ? mc.getAthlete().getDisplayName() : mc.getAthlete().getUsername())
                        .avatarUrl(mc.getAthlete().getAvatarUrl())
                        .bio(mc.getAthlete().getBio())
                        .roleTitle(mc.getRoleTitle() != null ? mc.getRoleTitle() : "Student Athlete")
                        .creditedAt(mc.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

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
                .creditedMentor(creditedMentor)
                .creditedMentors(creditedMentors)
                .applaudedBy(applaudedBy)
                .applaudedByCount(applaudedBy.size())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileResponse addMentorCredit(Long athleteId, AddMentorCreditRequest request) {
        User athlete = userRepository.findById(athleteId)
                .orElseThrow(() -> new ResourceNotFoundException("User", athleteId));

        User mentor = null;
        if (request.getMentorId() != null) {
            mentor = userRepository.findById(request.getMentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor User", request.getMentorId()));
        } else if (request.getMentorUsername() != null && !request.getMentorUsername().trim().isEmpty()) {
            String uName = request.getMentorUsername().trim().replace("@", "");
            mentor = userRepository.findByUsername(uName)
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor User @" + uName, 0L));
        } else {
            throw new IllegalArgumentException("Either mentorId or mentorUsername must be provided.");
        }

        if (athlete.getId().equals(mentor.getId())) {
            throw new IllegalArgumentException("You cannot credit yourself as your own teacher or coach.");
        }

        String roleTitle = (request.getRoleTitle() != null && !request.getRoleTitle().trim().isEmpty())
                ? sanitizeText(request.getRoleTitle().trim())
                : "Coach / Mentor";

        // As per requirement: "in my profile user can add a credit like ( small section ) in which name n username of the teacher / coache would be displayed"
        // Replace or update existing mentor credit for this athlete
        mentorCreditRepository.deleteByAthleteId(athlete.getId());

        MentorCredit credit = MentorCredit.builder()
                .athlete(athlete)
                .mentor(mentor)
                .roleTitle(roleTitle)
                .build();
        mentorCreditRepository.save(credit);

        return getUserProfile(athlete.getId(), athlete.getId());
    }

    @Transactional
    public UserProfileResponse removeMentorCredit(Long athleteId, Long mentorId) {
        if (mentorId != null) {
            mentorCreditRepository.deleteByAthleteIdAndMentorId(athleteId, mentorId);
        } else {
            mentorCreditRepository.deleteByAthleteId(athleteId);
        }
        return getUserProfile(athleteId, athleteId);
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
