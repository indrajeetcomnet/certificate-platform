package com.certificate.platform.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {

    private Long partnerId;
    private String partnerUsername;
    private String partnerDisplayName;
    private String partnerAvatarUrl;
    private String partnerRole;
    private String partnerBio;

    private String lastMessageContent;
    private LocalDateTime lastMessageTimestamp;
    private Long lastMessageSenderId;
    private Long unreadCount;
}

