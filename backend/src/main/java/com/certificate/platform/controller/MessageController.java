package com.certificate.platform.controller;

import com.certificate.platform.dto.ConversationResponse;
import com.certificate.platform.dto.MessageResponse;
import com.certificate.platform.dto.SendMessageRequest;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam(required = false) Long senderId,
            HttpServletRequest httpRequest) {
        Long resolvedSenderId = resolveUserId(senderId, httpRequest);
        MessageResponse response = messageService.sendMessage(resolvedSenderId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveUserId(userId, httpRequest);
        return ResponseEntity.ok(messageService.getConversationsList(resolvedUserId));
    }

    @GetMapping({"/conversation/{partnerId}", "/thread/{partnerId}"})
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long partnerId,
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveUserId(userId, httpRequest);
        return ResponseEntity.ok(messageService.getConversation(resolvedUserId, partnerId));
    }

    @PutMapping("/read/{partnerId}")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long partnerId,
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveUserId(userId, httpRequest);
        messageService.markConversationAsRead(resolvedUserId, partnerId);
        return ResponseEntity.ok(Map.of("message", "Conversation marked as read"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        Long resolvedUserId = resolveUserId(userId, httpRequest);
        long count = messageService.getUnreadCount(resolvedUserId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    private Long resolveUserId(Long paramUserId, HttpServletRequest httpRequest) {
        Long authenticatedId = (httpRequest != null && httpRequest.getAttribute("currentUserId") instanceof Long)
                ? (Long) httpRequest.getAttribute("currentUserId")
                : null;

        if (authenticatedId != null) {
            if (paramUserId != null && !paramUserId.equals(authenticatedId)) {
                throw new BadRequestException("Unauthorized: Cannot access or send direct messages for another user");
            }
            return authenticatedId;
        }

        if (paramUserId != null) {
            return paramUserId;
        }
        throw new BadRequestException("Authentication required: user could not be identified");
    }
}