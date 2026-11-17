package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CertificateVerifyResponse {

    private boolean verified;
    private CertificateResponse certificate;
    private String message;
}
