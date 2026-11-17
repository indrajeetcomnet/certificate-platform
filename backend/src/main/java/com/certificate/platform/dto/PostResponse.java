package com.certificate.platform.dto;

import com.certificate.platform.model.Post;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PostResponse {

    private Long id;
    private String content;
    private UserSummary user;
    private Long parentPostId;
    private Post.PostType postType;
    private Integer likesCount;
    private Integer commentsCount;
    private Integer viewsCount;
    private List<MediaResponse> media;
    private List<UserBadgeResponse> userBadges;
    private List<SponsorResponse> sponsors;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String username;
        private String displayName;
        private String avatarUrl;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class MediaResponse {
        private Long id;
        private String mediaUrl;
        private String mediaType;
        private Integer displayOrder;
    }
}
