package com.certificate.platform.controller;

import com.certificate.platform.dto.AssignBadgeRequest;
import com.certificate.platform.dto.BadgeResponse;
import com.certificate.platform.dto.CreateBadgeRequest;
import com.certificate.platform.dto.SponsorBadgeResponse;
import com.certificate.platform.dto.UserBadgeResponse;
import com.certificate.platform.service.BadgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @PostMapping
    public ResponseEntity<BadgeResponse> createBadge(@Valid @RequestBody CreateBadgeRequest request) {
        BadgeResponse created = badgeService.createBadge(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<BadgeResponse>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadges());
    }

    @GetMapping("/awarded")
    public ResponseEntity<List<UserBadgeResponse>> getAllAwardedBadges() {
        return ResponseEntity.ok(badgeService.getAllAwardedBadges());
    }

    @PostMapping("/assign")
    public ResponseEntity<UserBadgeResponse> assignBadgeToUser(@Valid @RequestBody AssignBadgeRequest request) {
        UserBadgeResponse assigned = badgeService.assignBadgeToUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(assigned);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserBadgeResponse>> getUserBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.getUserBadges(userId));
    }

    @GetMapping("/{id}/sponsors")
    public ResponseEntity<List<SponsorBadgeResponse>> getActiveSponsorsForBadge(@PathVariable Long id) {
        return ResponseEntity.ok(badgeService.getActiveSponsorsForBadge(id));
    }
}
