package com.certificate.platform.controller;

import com.certificate.platform.dto.CreateSponsorRequest;
import com.certificate.platform.dto.LinkBadgeRequest;
import com.certificate.platform.dto.SponsorBadgeResponse;
import com.certificate.platform.dto.SponsorResponse;
import com.certificate.platform.model.User;
import com.certificate.platform.service.SponsorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sponsors")
@RequiredArgsConstructor
public class SponsorController {

    private final SponsorService sponsorService;

    @GetMapping
    public ResponseEntity<List<SponsorResponse>> getAllSponsors() {
        return ResponseEntity.ok(sponsorService.getAllSponsors());
    }

    @GetMapping("/my")
    public ResponseEntity<List<SponsorResponse>> getMySponsors(HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("currentUser");
        Long userId = user != null ? user.getId() : (Long) httpRequest.getAttribute("currentUserId");
        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(sponsorService.getMySponsors(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SponsorResponse> getSponsor(@PathVariable Long id) {
        return ResponseEntity.ok(sponsorService.getSponsor(id));
    }

    @PostMapping
    public ResponseEntity<SponsorResponse> createSponsor(
            @Valid @RequestBody CreateSponsorRequest request,
            HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("currentUser");
        SponsorResponse created = sponsorService.createSponsor(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/click")
    public ResponseEntity<SponsorResponse> recordClick(@PathVariable Long id) {
        return ResponseEntity.ok(sponsorService.recordClick(id));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<SponsorResponse> toggleStatus(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("currentUser");
        return ResponseEntity.ok(sponsorService.toggleStatus(id, user));
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<SponsorResponse> addDeposit(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body) {
        BigDecimal amount = body.getOrDefault("amount", BigDecimal.ZERO);
        return ResponseEntity.ok(sponsorService.addBudget(id, amount));
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
