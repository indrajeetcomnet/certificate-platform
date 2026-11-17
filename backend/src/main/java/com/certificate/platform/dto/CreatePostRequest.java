package com.certificate.platform.dto;

import com.certificate.platform.model.Post;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreatePostRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private List<String> mediaUrls;

    private Long parentPostId;

    private Post.PostType postType;
}
