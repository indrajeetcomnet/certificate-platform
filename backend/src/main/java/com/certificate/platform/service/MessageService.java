package com.certificate.platform.service;

import com.certificate.platform.dto.ConversationResponse;
import com.certificate.platform.dto.MessageResponse;
import com.certificate.platform.dto.SendMessageRequest;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.Message;
import com.certificate.platform.model.User;
import com.certificate.platform.repository.MessageRepository;
import com.certificate.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public MessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        if (senderId.equals(request.getRecipientId())) {
            throw new BadRequestException("You cannot send a direct message to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with ID: " + senderId));

        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found with ID: " + request.getRecipientId()));

        Message message = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        if (auditService != null) {
            auditService.logEvent(sender, "MESSAGE_SENT",
                    "Direct message sent from @" + sender.getUsername() + " to @" + recipient.getUsername() + " (msg #" + saved.getId() + ")",
                    "INTERNAL");
        }

        return mapToResponse(saved, senderId);
    }

    @Transactional
    public List<MessageResponse> getConversation(Long currentUserId, Long partnerId) {
        if (!userRepository.existsById(partnerId)) {
            throw new ResourceNotFoundException("User not found with ID: " + partnerId);
        }

        // Mark incoming messages from partner as read
        messageRepository.markMessagesAsRead(currentUserId, partnerId, LocalDateTime.now());

        List<Message> messages = messageRepository.findConversation(currentUserId, partnerId);
        return messages.stream()
                .map(m -> mapToResponse(m, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsList(Long currentUserId) {
        List<Long> partnerIds = messageRepository.findConversationPartnerIds(currentUserId);
        List<ConversationResponse> conversations = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            Optional<User> partnerOpt = userRepository.findById(partnerId);
            if (partnerOpt.isEmpty()) continue;
            User partner = partnerOpt.get();

            List<Message> latestList = messageRepository.findLatestMessageBetween(currentUserId, partnerId, PageRequest.of(0, 1));
            if (latestList.isEmpty()) continue;

            Message latest = latestList.get(0);
            long unread = messageRepository.countByRecipientIdAndSenderIdAndIsReadFalse(currentUserId, partnerId);

            conversations.add(ConversationResponse.builder()
                    .partnerId(partner.getId())
                    .partnerUsername(partner.getUsername())
                    .partnerDisplayName(partner.getDisplayName() != null ? partner.getDisplayName() : partner.getUsername())
                    .partnerAvatarUrl(partner.getAvatarUrl())
                    .partnerRole(partner.getRole().name())
                    .partnerBio(partner.getBio())
                    .lastMessageContent(latest.getContent())
                    .lastMessageTimestamp(latest.getCreatedAt())
                    .lastMessageSenderId(latest.getSender().getId())
                    .unreadCount(unread)
                    .build());
        }

        // Sort by most recent message descending
        conversations.sort((a, b) -> {
            if (a.getLastMessageTimestamp() == null) return 1;
            if (b.getLastMessageTimestamp() == null) return -1;
            return b.getLastMessageTimestamp().compareTo(a.getLastMessageTimestamp());
        });

        return conversations;
    }

    @Transactional
    public void markConversationAsRead(Long currentUserId, Long partnerId) {
        messageRepository.markMessagesAsRead(currentUserId, partnerId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long currentUserId) {
        return messageRepository.countByRecipientIdAndIsReadFalse(currentUserId);
    }

    private MessageResponse mapToResponse(Message message, Long currentUserId) {
        User sender = message.getSender();
        User recipient = message.getRecipient();

        return MessageResponse.builder()
                .id(message.getId())
                .senderId(sender.getId())
                .senderUsername(sender.getUsername())
                .senderDisplayName(sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername())
                .senderAvatarUrl(sender.getAvatarUrl())
                .recipientId(recipient.getId())
                .recipientUsername(recipient.getUsername())
                .recipientDisplayName(recipient.getDisplayName() != null ? recipient.getDisplayName() : recipient.getUsername())
                .recipientAvatarUrl(recipient.getAvatarUrl())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .isMine(sender.getId().equals(currentUserId))
                .build();
    }
}

