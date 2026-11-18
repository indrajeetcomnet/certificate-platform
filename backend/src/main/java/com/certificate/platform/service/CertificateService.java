package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.AccessDeniedException;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.Certificate;
import com.certificate.platform.model.Institution;
import com.certificate.platform.model.User;
import com.certificate.platform.repository.CertificateRepository;
import com.certificate.platform.repository.InstitutionRepository;
import com.certificate.platform.repository.UserRepository;
import com.certificate.platform.util.UniqueCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;

    @Transactional
    public CertificateResponse createCertificate(CreateCertificateRequest request) {
        Institution institution = institutionRepository.findById(request.getInstitutionId())
                .orElseGet(() -> institutionRepository.findAll().stream().findFirst().orElseGet(() -> {
                    User instUser = userRepository.findAll().stream()
                            .filter(u -> u.getRole() == User.Role.INSTITUTION)
                            .findFirst()
                            .orElseGet(() -> userRepository.save(User.builder()
                                    .username("athlos_academy")
                                    .email("admin@athlosacademy.org")
                                    .displayName("Athlos Sports Academy")
                                    .passwordHash("inst_hash_pass")
                                    .role(User.Role.INSTITUTION)
                                    .build()));
                    return institutionRepository.save(Institution.builder()
                            .name("Athlos Sports Academy")
                            .description("Official Accredited Sports Academy")
                            .verified(true)
                            .user(instUser)
                            .build());
                }));

        String uniqueCode;
        if (request.getUniqueCode() != null && !request.getUniqueCode().isBlank()) {
            uniqueCode = request.getUniqueCode().trim().toUpperCase();
            if (certificateRepository.findByUniqueCode(uniqueCode).isPresent()) {
                throw new IllegalArgumentException("Identification code '" + uniqueCode + "' is already assigned to another certificate. Please choose a unique identification number.");
            }
        } else if (request.getCustomPrefix() != null && !request.getCustomPrefix().isBlank()) {
            uniqueCode = generateCustomCode(request.getCustomPrefix().trim().toUpperCase(), request.getCodeFormat());
        } else {
            uniqueCode = generateUniqueCode();
        }

        Certificate certificate = Certificate.builder()
                .uniqueCode(uniqueCode)
                .title(request.getTitle())
                .description(request.getDescription())
                .recipientName(request.getRecipientName())
                .recipientEmail(request.getRecipientEmail())
                .institution(institution)
                .issuedAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .templateData(request.getTemplateData())
                .verified(true)
                .build();

        certificate = certificateRepository.save(certificate);
        return mapToResponse(certificate);
    }

    @Transactional
    public List<CertificateResponse> bulkCreate(BulkCertificateRequest request) {
        List<CertificateResponse> responses = new ArrayList<>();
        for (CreateCertificateRequest certRequest : request.getCertificates()) {
            responses.add(createCertificate(certRequest));
        }
        return responses;
    }

    public CertificateVerifyResponse verifyByCode(String uniqueCode) {
        if (uniqueCode == null || !uniqueCode.trim().matches("^[A-Za-z0-9_-]{3,50}$")) {
            return CertificateVerifyResponse.builder()
                    .verified(false)
                    .certificate(null)
                    .message("Invalid certificate format.")
                    .build();
        }

        return certificateRepository.findByUniqueCode(uniqueCode.trim())
                .map(cert -> CertificateVerifyResponse.builder()
                        .verified(cert.getVerified())
                        .certificate(mapToResponse(cert))
                        .message(cert.getVerified() ? "Certificate is valid and verified." : "Certificate could not be verified.")
                        .build())
                .orElse(CertificateVerifyResponse.builder()
                        .verified(false)
                        .certificate(null)
                        .message("No certificate found with code: " + uniqueCode.trim())
                        .build());
    }

    public Page<CertificateResponse> getByInstitution(Long institutionId, Pageable pageable) {
        return certificateRepository.findByInstitutionId(institutionId, pageable)
                .map(this::mapToResponse);
    }

    public CertificateResponse getById(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", id));
        return mapToResponse(certificate);
    }

    @Transactional
    public CertificateResponse updateCertificate(Long id, CreateCertificateRequest request) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", id));

        if (request.getUniqueCode() != null && !request.getUniqueCode().isBlank()) {
            String newCode = request.getUniqueCode().trim().toUpperCase();
            if (!newCode.equals(certificate.getUniqueCode())) {
                if (certificateRepository.findByUniqueCode(newCode).isPresent()) {
                    throw new IllegalArgumentException("Identification code '" + newCode + "' is already assigned to another certificate.");
                }
                certificate.setUniqueCode(newCode);
            }
        }

        certificate.setTitle(request.getTitle());
        certificate.setDescription(request.getDescription());
        certificate.setRecipientName(request.getRecipientName());
        certificate.setRecipientEmail(request.getRecipientEmail());
        certificate.setTemplateData(request.getTemplateData());
        certificate.setExpiresAt(request.getExpiresAt());

        certificate = certificateRepository.save(certificate);
        return mapToResponse(certificate);
    }

    @Transactional
    public void deleteCertificate(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", id));
        certificateRepository.delete(certificate);
    }

    public String generateCustomCode(String prefix, String style) {
        String code;
        int attempts = 0;
        do {
            code = UniqueCodeGenerator.generateFormatted(prefix, style);
            attempts++;
            if (attempts > 100) {
                code = UniqueCodeGenerator.generate(prefix);
                break;
            }
        } while (certificateRepository.findByUniqueCode(code).isPresent());
        return code;
    }

    public boolean isCodeAvailable(String code) {
        if (code == null || code.trim().isEmpty()) {
            return false;
        }
        return certificateRepository.findByUniqueCode(code.trim().toUpperCase()).isEmpty();
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = UniqueCodeGenerator.generate();
        } while (certificateRepository.findByUniqueCode(code).isPresent());
        return code;
    }

    private CertificateResponse mapToResponse(Certificate cert) {
        return CertificateResponse.builder()
                .id(cert.getId())
                .uniqueCode(cert.getUniqueCode())
                .title(cert.getTitle())
                .description(cert.getDescription())
                .recipientName(cert.getRecipientName())
                .recipientEmail(cert.getRecipientEmail())
                .institutionName(cert.getInstitution().getName())
                .institutionId(cert.getInstitution().getId())
                .issuedAt(cert.getIssuedAt())
                .expiresAt(cert.getExpiresAt())
                .templateData(cert.getTemplateData())
                .verified(cert.getVerified())
                .createdAt(cert.getCreatedAt())
                .build();
    }
}
