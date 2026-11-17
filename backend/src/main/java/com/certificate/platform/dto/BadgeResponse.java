package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BadgeResponse {

    private Long id;
    private String name;
    private Integer rank;
    private String rankDisplay;
    private String category;
    private String iconUrl;
    private String description;
    private String institutionName;
    private LocalDateTime createdAt;
}
