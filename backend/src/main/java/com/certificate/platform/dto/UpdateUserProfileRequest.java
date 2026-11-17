package com.certificate.platform.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UpdateUserProfileRequest {

    @Size(max = 60, message = "Display name cannot exceed 60 characters")
    private String displayName;

    @Size(max = 255, message = "Avatar URL cannot exceed 255 characters")
    private String avatarUrl;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;
}
