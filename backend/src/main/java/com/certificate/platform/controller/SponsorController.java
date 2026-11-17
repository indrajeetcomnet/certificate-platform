package com.certificate.platform.controller;

import com.certificate.platform.dto.CreateSponsorRequest;
import com.certificate.platform.dto.LinkBadgeRequest;
import com.certificate.platform.dto.SponsorBadgeResponse;
import com.certificate.platform.dto.SponsorResponse;
import com.certificate.platform.service.SponsorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sponsors")
@RequiredArgsConstructor
public class SponsorController {

    private final SponsorService sponsorService;

    @GetMapping
    public ResponseEntity<List<SponsorResponse>> getAllSponsors() {
        return ResponseEntity.ok(sponsorService.getAllSponsors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SponsorResponse> getSponsor(@PathVariable Long id) {
        return ResponseEntity.ok(sponsorService.getSponsor(id));
    }

    @PostMapping
    public ResponseEntity<SponsorResponse> createSponsor(@Valid @RequestBody CreateSponsorRequest request) {
        SponsorResponse created = sponsorService.createSponsor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SponsorResponse> updateSponsor(
            @PathVariable Long id,
            @Valid @RequestBody CreateSponsorRequest request) {
        return ResponseEntity.ok(sponsorService.updateSponsor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSponsor(@PathVariable Long id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/link-badge")
    public ResponseEntity<SponsorBadgeResponse> linkBadge(
            @PathVariable Long id,
            @Valid @RequestBody LinkBadgeRequest request) {
        SponsorBadgeResponse response = sponsorService.linkBadge(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/badges")
    public ResponseEntity<List<SponsorBadgeResponse>> getActiveSponsorBadges(@PathVariable Long id) {
        return ResponseEntity.ok(sponsorService.getActiveSponsorBadges(id));
    }
}
