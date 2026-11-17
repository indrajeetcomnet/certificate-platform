package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateBadgeRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Rank is required")
    private Integer rank;

    private String category;

    private Long institutionId;

    private String iconUrl;

    private String description;
}
