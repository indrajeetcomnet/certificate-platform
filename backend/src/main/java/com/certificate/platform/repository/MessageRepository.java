package com.certificate.platform.repository;

import com.certificate.platform.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.recipient " +
           "WHERE (m.sender.id = :u1 AND m.recipient.id = :u2) " +
           "   OR (m.sender.id = :u2 AND m.recipient.id = :u1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.recipient.id ELSE m.sender.id END " +
           "FROM Message m WHERE m.sender.id = :userId OR m.recipient.id = :userId")
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.recipient " +
           "WHERE (m.sender.id = :u1 AND m.recipient.id = :u2) " +
           "   OR (m.sender.id = :u2 AND m.recipient.id = :u1) " +
           "ORDER BY m.createdAt DESC")
    List<Message> findLatestMessageBetween(@Param("u1") Long u1, @Param("u2") Long u2, Pageable pageable);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    long countByRecipientIdAndSenderIdAndIsReadFalse(Long recipientId, Long senderId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :now " +
           "WHERE m.recipient.id = :recipientId AND m.sender.id = :senderId AND m.isRead = false")
    int markMessagesAsRead(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId, @Param("now") LocalDateTime now);
}

