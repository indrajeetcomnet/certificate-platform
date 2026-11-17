package com.certificate.platform.controller;

import com.certificate.platform.dto.CommentResponse;
import com.certificate.platform.dto.CreateCommentRequest;
import com.certificate.platform.dto.CreatePostRequest;
import com.certificate.platform.dto.LikeRequest;
import com.certificate.platform.dto.PostResponse;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getFeed(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPost(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable Long userId) {
        return ResponseEntity.ok(postService.getUserPosts(userId));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @RequestParam(required = false) Long userId,
            @Valid @RequestBody CreatePostRequest request,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveAuthenticatedUserId(userId, httpRequest);
        PostResponse created = postService.createPost(request, resolvedUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likePost(
            @PathVariable Long id,
            @RequestBody(required = false) LikeRequest request,
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long targetUserId = (request != null && request.getUserId() != null) ? request.getUserId() : userId;
        Long resolvedUserId = resolveAuthenticatedUserId(targetUserId, httpRequest);
        postService.likePost(id, resolvedUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlikePost(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveAuthenticatedUserId(userId, httpRequest);
        postService.unlikePost(id, resolvedUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveAuthenticatedUserId(request.getUserId(), httpRequest);
        request.setUserId(resolvedUserId);
        CommentResponse created = postService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    private Long resolveAuthenticatedUserId(Long requestedUserId, HttpServletRequest httpRequest) {
        Long authenticatedId = (httpRequest != null) ? (Long) httpRequest.getAttribute("currentUserId") : null;
        if (authenticatedId != null) {
            if (requestedUserId != null && !requestedUserId.equals(authenticatedId)) {
                throw new BadRequestException("Unauthorized: Cannot perform operations on behalf of another user account");
            }
            return authenticatedId;
        }
        if (requestedUserId != null) {
            return requestedUserId;
        }
        throw new BadRequestException("Authentication required: user could not be identified");
    }
}
