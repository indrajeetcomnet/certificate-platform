package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ErrorResponse {

    private int status;
    private String message;
    private String detail;
    private LocalDateTime timestamp;
}
