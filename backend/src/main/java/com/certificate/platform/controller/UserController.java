package com.certificate.platform.controller;

import com.certificate.platform.dto.UpdateUserProfileRequest;
import com.certificate.platform.dto.UserProfileResponse;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getAllUsers(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(userService.getAllUsers(q));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long requesterId = request != null ? (Long) request.getAttribute("currentUserId") : null;
        return ResponseEntity.ok(userService.getUserProfile(id, requesterId));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserProfileRequest request,
            HttpServletRequest httpRequest) {
        Long requesterId = httpRequest != null ? (Long) httpRequest.getAttribute("currentUserId") : null;
        String requesterRole = httpRequest != null ? (String) httpRequest.getAttribute("currentUserRole") : null;

        // Broken Object Level Authorization (BOLA/IDOR) protection:
        // Users can only update their own profile; admins can update any profile.
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!requesterId.equals(id) && !"ADMIN".equalsIgnoreCase(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @PostMapping("/{id}/mentor-credits")
    public ResponseEntity<UserProfileResponse> addMentorCredit(
            @PathVariable Long id,
            @RequestBody com.certificate.platform.dto.AddMentorCreditRequest request,
            HttpServletRequest httpRequest) {
        Long requesterId = httpRequest != null ? (Long) httpRequest.getAttribute("currentUserId") : null;
        String requesterRole = httpRequest != null ? (String) httpRequest.getAttribute("currentUserRole") : null;

        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!requesterId.equals(id) && !"ADMIN".equalsIgnoreCase(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(userService.addMentorCredit(id, request));
    }

    @DeleteMapping("/{id}/mentor-credits")
    public ResponseEntity<UserProfileResponse> removeMentorCredit(
            @PathVariable Long id,
            @RequestParam(required = false) Long mentorId,
            HttpServletRequest httpRequest) {
        Long requesterId = httpRequest != null ? (Long) httpRequest.getAttribute("currentUserId") : null;
        String requesterRole = httpRequest != null ? (String) httpRequest.getAttribute("currentUserRole") : null;

        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!requesterId.equals(id) && !"ADMIN".equalsIgnoreCase(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(userService.removeMentorCredit(id, mentorId));
    }
}
