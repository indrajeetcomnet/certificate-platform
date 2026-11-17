package com.certificate.platform.controller;

import com.certificate.platform.dto.BulkCertificateRequest;
import com.certificate.platform.dto.CertificateResponse;
import com.certificate.platform.dto.CertificateVerifyResponse;
import com.certificate.platform.dto.CreateCertificateRequest;
import com.certificate.platform.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping
    public ResponseEntity<CertificateResponse> createCertificate(
            @Valid @RequestBody CreateCertificateRequest request) {
        CertificateResponse created = certificateService.createCertificate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<CertificateResponse>> bulkCreateCertificates(
            @Valid @RequestBody BulkCertificateRequest request) {
        List<CertificateResponse> created = certificateService.bulkCreate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/generate-code")
    public ResponseEntity<java.util.Map<String, String>> generateCode(
            @RequestParam(required = false, defaultValue = "CERT") String prefix,
            @RequestParam(required = false, defaultValue = "STANDARD") String style) {
        String code = certificateService.generateCustomCode(prefix, style);
        return ResponseEntity.ok(java.util.Map.of("code", code, "status", "success"));
    }

    @GetMapping("/check-code")
    public ResponseEntity<java.util.Map<String, Object>> checkCode(@RequestParam String code) {
        boolean available = certificateService.isCodeAvailable(code);
        return ResponseEntity.ok(java.util.Map.of("code", code, "available", available));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<CertificateResponse> getCertificateById(@PathVariable Long id) {
        return ResponseEntity.ok(certificateService.getById(id));
    }

    @GetMapping("/verify/{uniqueCode}")
    public ResponseEntity<CertificateVerifyResponse> verifyCertificate(
            @PathVariable String uniqueCode) {
        CertificateVerifyResponse response = certificateService.verifyByCode(uniqueCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/institution/{institutionId}")
    public ResponseEntity<Page<CertificateResponse>> getByInstitution(
            @PathVariable Long institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(certificateService.getByInstitution(institutionId, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CertificateResponse> updateCertificate(
            @PathVariable Long id,
            @Valid @RequestBody CreateCertificateRequest request) {
        return ResponseEntity.ok(certificateService.updateCertificate(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCertificate(@PathVariable Long id) {
        certificateService.deleteCertificate(id);
        return ResponseEntity.noContent().build();
    }
}
