package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType; // "Bearer"
    private Long expiresIn;
    private Long userId;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role; // "USER" or "INSTITUTION"
    private Long institutionId;
    private String message;
}
