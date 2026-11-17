package com.certificate.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BulkCertificateRequest {

    @NotEmpty(message = "At least one certificate is required")
    @Valid
    private List<CreateCertificateRequest> certificates;
}
