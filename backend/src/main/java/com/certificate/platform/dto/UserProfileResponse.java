package com.certificate.platform.dto;

import com.certificate.platform.model.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private User.Role role;
    private List<UserBadgeResponse> badges;
    private MentorSummaryResponse creditedMentor;
    private List<MentorSummaryResponse> creditedMentors;
    private List<MentorSummaryResponse> applaudedBy;
    @Builder.Default
    private int applaudedByCount = 0;
    private LocalDateTime createdAt;
}
