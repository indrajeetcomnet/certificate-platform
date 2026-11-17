package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LikeRequest {
    private Long userId;
}
