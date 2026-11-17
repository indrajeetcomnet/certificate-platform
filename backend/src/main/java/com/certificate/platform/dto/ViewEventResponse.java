package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ViewEventResponse {

    private boolean recorded;
    private boolean incremented;
    private Long viewsCount;
    private String message;
}
