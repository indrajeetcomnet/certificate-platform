package com.certificate.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InstitutionLoginRequest {

    @NotBlank(message = "Institution code or email is required")
    @Size(max = 100, message = "Identifier must not exceed 100 characters")
    private String institutionCodeOrEmail;

    @NotBlank(message = "Security password is required")
    @Size(max = 100, message = "Password must not exceed 100 characters")
    private String password;
}
