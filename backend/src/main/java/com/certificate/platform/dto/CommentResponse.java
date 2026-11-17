package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommentResponse {

    private Long id;
    private String content;
    private PostResponse.UserSummary user;
    private Long postId;
    private Integer likesCount;
    private LocalDateTime createdAt;
}