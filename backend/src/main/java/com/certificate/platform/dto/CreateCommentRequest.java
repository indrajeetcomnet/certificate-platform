package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateCommentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private Long userId;
}
