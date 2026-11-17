package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentParticipantRepository participantRepository;
    private final TournamentMatchRepository matchRepository;
    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final CertificateRepository certificateRepository;

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(t -> mapToResponse(t, false))
                .collect(Collectors.toList());
    }

    public List<TournamentResponse> getTournamentsByInstitution(Long institutionId) {
        return tournamentRepository.findByInstitutionIdOrderByCreatedAtDesc(institutionId).stream()
                .map(t -> mapToResponse(t, false))
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", id));
        return mapToResponse(tournament, true);
    }

    @Transactional
    public TournamentResponse createTournament(CreateTournamentRequest request, Long currentUserId) {
        Institution institution = institutionRepository.findByUserId(currentUserId)
                .orElseGet(() -> institutionRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BadRequestException("No accredited institution found to host tournament")));

        Tournament tournament = Tournament.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .sport(request.getSport().trim())
                .format(request.getFormat().trim())
                .venue(request.getVenue() != null ? request.getVenue().trim() : "Main Arena")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .registrationDeadline(request.getRegistrationDeadline())
                .status("REGISTRATION_OPEN")
                .maxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 32)
                .institution(institution)
                .customFormSchema(request.getCustomFormSchema() != null ? request.getCustomFormSchema() : "[]")
                .linkedBadgeGoldId(request.getLinkedBadgeGoldId())
                .linkedBadgeSilverId(request.getLinkedBadgeSilverId())
                .linkedBadgeBronzeId(request.getLinkedBadgeBronzeId())
                .linkedCertificateTemplate(request.getLinkedCertificateTemplate())
                .build();

        tournament = tournamentRepository.save(tournament);
        log.info("Created tournament '{}' (ID: {}) by institution '{}'", tournament.getTitle(), tournament.getId(), institution.getName());
        return mapToResponse(tournament, true);
    }

    @Transactional
    public TournamentResponse updateTournament(Long id, CreateTournamentRequest request) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) tournament.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) tournament.setDescription(request.getDescription());
        if (request.getSport() != null && !request.getSport().isBlank()) tournament.setSport(request.getSport().trim());
        if (request.getFormat() != null && !request.getFormat().isBlank()) tournament.setFormat(request.getFormat().trim());
        if (request.getVenue() != null) tournament.setVenue(request.getVenue().trim());
        if (request.getStartDate() != null) tournament.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) tournament.setEndDate(request.getEndDate());
        if (request.getRegistrationDeadline() != null) tournament.setRegistrationDeadline(request.getRegistrationDeadline());
        if (request.getMaxParticipants() != null) tournament.setMaxParticipants(request.getMaxParticipants());
        if (request.getCustomFormSchema() != null) tournament.setCustomFormSchema(request.getCustomFormSchema());
        if (request.getLinkedBadgeGoldId() != null) tournament.setLinkedBadgeGoldId(request.getLinkedBadgeGoldId());
        if (request.getLinkedBadgeSilverId() != null) tournament.setLinkedBadgeSilverId(request.getLinkedBadgeSilverId());
        if (request.getLinkedBadgeBronzeId() != null) tournament.setLinkedBadgeBronzeId(request.getLinkedBadgeBronzeId());
        if (request.getLinkedCertificateTemplate() != null) tournament.setLinkedCertificateTemplate(request.getLinkedCertificateTemplate());

        tournament = tournamentRepository.save(tournament);
        return mapToResponse(tournament, true);
    }

    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", id));
        matchRepository.deleteAll(matchRepository.findByTournamentIdOrderByMatchNumberAsc(id));
        participantRepository.deleteAll(participantRepository.findByTournamentIdOrderByCreatedAtAsc(id));
        tournamentRepository.delete(tournament);
    }

    @Transactional
    public TournamentParticipantResponse registerParticipant(Long tournamentId, RegisterParticipantRequest request, Long currentUserId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", tournamentId));

        User user = null;
        Long targetUserId = request.getUserId() != null ? request.getUserId() : currentUserId;
        if (targetUserId != null) {
            user = userRepository.findById(targetUserId).orElse(null);
        }

        String athleteName = request.getAthleteName();
        if ((athleteName == null || athleteName.isBlank()) && user != null) {
            athleteName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        }
        if (athleteName == null || athleteName.isBlank()) {
            athleteName = "Athlete Participant";
        }

        String email = request.getEmail() != null ? request.getEmail() : (user != null ? user.getEmail() : null);

        TournamentParticipant participant = TournamentParticipant.builder()
                .tournament(tournament)
                .user(user)
                .athleteName(athleteName.trim())
                .email(email)
                .phone(request.getPhone())
                .status("CONFIRMED")
                .formResponses(request.getFormResponses() != null ? request.getFormResponses() : "{}")
                .build();

        participant = participantRepository.save(participant);
        log.info("Registered participant '{}' in tournament '{}'", athleteName, tournament.getTitle());
        return mapToParticipantResponse(participant);
    }

    @Transactional
    public TournamentParticipantResponse updateParticipantStatus(Long tournamentId, Long participantId, String status) {
        TournamentParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("TournamentParticipant", participantId));
        participant.setStatus(status.toUpperCase());
        participant = participantRepository.save(participant);
        return mapToParticipantResponse(participant);
    }

    @Transactional
    public TournamentMatchResponse createMatch(Long tournamentId, TournamentMatch request) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", tournamentId));
        request.setTournament(tournament);
        TournamentMatch saved = matchRepository.save(request);
        return mapToMatchResponse(saved);
    }

    @Transactional
    public TournamentMatchResponse updateMatchScore(Long tournamentId, Long matchId, UpdateMatchScoreRequest request) {
        TournamentMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("TournamentMatch", matchId));

        if (request.getScore1() != null) match.setScore1(request.getScore1());
        if (request.getScore2() != null) match.setScore2(request.getScore2());
        if (request.getWinnerParticipantId() != null) match.setWinnerParticipantId(request.getWinnerParticipantId());
        if (request.getStatus() != null) match.setStatus(request.getStatus().toUpperCase());
        if (request.getScheduledDate() != null) match.setScheduledDate(request.getScheduledDate());
        if (request.getScheduledTime() != null) match.setScheduledTime(request.getScheduledTime());
        if (request.getCourtVenue() != null) match.setCourtVenue(request.getCourtVenue());

        match = matchRepository.save(match);
        return mapToMatchResponse(match);
    }

    @Transactional
    public TournamentResponse finalizeTournament(Long tournamentId, FinalizeTournamentRequest request) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", tournamentId));

        TournamentParticipant p1 = request.getWinner1stParticipantId() != null
                ? participantRepository.findById(request.getWinner1stParticipantId()).orElse(null) : null;
        TournamentParticipant p2 = request.getWinner2ndParticipantId() != null
                ? participantRepository.findById(request.getWinner2ndParticipantId()).orElse(null) : null;
        TournamentParticipant p3 = request.getWinner3rdParticipantId() != null
                ? participantRepository.findById(request.getWinner3rdParticipantId()).orElse(null) : null;

        if (p1 != null) tournament.setWinner1stName(p1.getAthleteName());
        if (p2 != null) tournament.setWinner2ndName(p2.getAthleteName());
        if (p3 != null) tournament.setWinner3rdName(p3.getAthleteName());
        tournament.setStatus("COMPLETED");
        tournament = tournamentRepository.save(tournament);

        // Batch Award Badges and Certificates if requested
        if (Boolean.TRUE.equals(request.getAwardCredentials())) {
            awardPodiumCredentials(tournament, p1, p2, p3);
        }

        return mapToResponse(tournament, true);
    }

    private void awardPodiumCredentials(Tournament tournament, TournamentParticipant p1, TournamentParticipant p2, TournamentParticipant p3) {
        // 1st Place Gold Medal
        if (p1 != null) {
            awardBadgeIfLinked(p1.getUser(), tournament.getLinkedBadgeGoldId(), tournament.getInstitution());
            issueCertificate(tournament, p1, "Champion - Gold Medal", "1st Place Winner");
        }
        // 2nd Place Silver Medal
        if (p2 != null) {
            awardBadgeIfLinked(p2.getUser(), tournament.getLinkedBadgeSilverId(), tournament.getInstitution());
            issueCertificate(tournament, p2, "Runner Up - Silver Medal", "2nd Place Finalist");
        }
        // 3rd Place Bronze Medal
        if (p3 != null) {
            awardBadgeIfLinked(p3.getUser(), tournament.getLinkedBadgeBronzeId(), tournament.getInstitution());
            issueCertificate(tournament, p3, "Podium Finish - Bronze Medal", "3rd Place Finisher");
        }
    }

    private void awardBadgeIfLinked(User user, Long badgeId, Institution institution) {
        if (user == null || badgeId == null) return;
        Badge badge = badgeRepository.findById(badgeId).orElse(null);
        if (badge == null) return;

        // Check if user already has this badge
        List<UserBadge> existing = userBadgeRepository.findByUserId(user.getId());
        boolean alreadyHas = existing.stream().anyMatch(ub -> ub.getBadge().getId().equals(badgeId));
        if (!alreadyHas) {
            UserBadge userBadge = UserBadge.builder()
                    .user(user)
                    .badge(badge)
                    .awardedBy(institution)
                    .awardedAt(LocalDateTime.now())
                    .build();
            userBadgeRepository.save(userBadge);
            log.info("Awarded badge '{}' to athlete '{}'", badge.getName(), user.getUsername());
        }
    }

    private void issueCertificate(Tournament tournament, TournamentParticipant participant, String titleSuffix, String achievementDesc) {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String code = "GC-2026-" + tournament.getSport().replaceAll("[^A-Za-z0-9]", "").toUpperCase().substring(0, Math.min(3, tournament.getSport().length())) + "-" + randomSuffix;

        Certificate cert = Certificate.builder()
                .uniqueCode(code)
                .title(tournament.getTitle() + " - " + titleSuffix)
                .description("Awarded for outstanding athletic performance as " + achievementDesc + " in the " + tournament.getTitle() + " organized by " + tournament.getInstitution().getName() + ".")
                .recipientName(participant.getAthleteName())
                .recipientEmail(participant.getEmail())
                .institution(tournament.getInstitution())
                .issuedAt(LocalDateTime.now())
                .verified(true)
                .build();
        certificateRepository.save(cert);
        log.info("Issued certificate '{}' (Code: {}) to '{}'", cert.getTitle(), cert.getUniqueCode(), cert.getRecipientName());
    }

    private TournamentResponse mapToResponse(Tournament t, boolean includeDetails) {
        long count = participantRepository.countByTournamentId(t.getId());

        String goldName = t.getLinkedBadgeGoldId() != null
                ? badgeRepository.findById(t.getLinkedBadgeGoldId()).map(Badge::getName).orElse("Gold Medal") : null;
        String silverName = t.getLinkedBadgeSilverId() != null
                ? badgeRepository.findById(t.getLinkedBadgeSilverId()).map(Badge::getName).orElse("Silver Medal") : null;
        String bronzeName = t.getLinkedBadgeBronzeId() != null
                ? badgeRepository.findById(t.getLinkedBadgeBronzeId()).map(Badge::getName).orElse("Bronze Medal") : null;

        List<TournamentParticipantResponse> participants = null;
        List<TournamentMatchResponse> matches = null;

        if (includeDetails) {
            participants = participantRepository.findByTournamentIdOrderByCreatedAtAsc(t.getId()).stream()
                    .map(this::mapToParticipantResponse)
                    .collect(Collectors.toList());
            matches = matchRepository.findByTournamentIdOrderByMatchNumberAsc(t.getId()).stream()
                    .map(this::mapToMatchResponse)
                    .collect(Collectors.toList());
        }

        return TournamentResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .sport(t.getSport())
                .format(t.getFormat())
                .venue(t.getVenue())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .registrationDeadline(t.getRegistrationDeadline())
                .status(t.getStatus())
                .maxParticipants(t.getMaxParticipants())
                .institutionId(t.getInstitution() != null ? t.getInstitution().getId() : null)
                .institutionName(t.getInstitution() != null ? t.getInstitution().getName() : "Accredited Academy")
                .customFormSchema(t.getCustomFormSchema())
                .linkedBadgeGoldId(t.getLinkedBadgeGoldId())
                .linkedBadgeGoldName(goldName)
                .linkedBadgeSilverId(t.getLinkedBadgeSilverId())
                .linkedBadgeSilverName(silverName)
                .linkedBadgeBronzeId(t.getLinkedBadgeBronzeId())
                .linkedBadgeBronzeName(bronzeName)
                .linkedCertificateTemplate(t.getLinkedCertificateTemplate())
                .winner1stName(t.getWinner1stName())
                .winner2ndName(t.getWinner2ndName())
                .winner3rdName(t.getWinner3rdName())
                .participantCount(count)
                .participants(participants)
                .matches(matches)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TournamentParticipantResponse mapToParticipantResponse(TournamentParticipant p) {
        String avatar = null;
        if (p.getUser() != null) {
            avatar = p.getUser().getAvatarUrl();
        }
        return TournamentParticipantResponse.builder()
                .id(p.getId())
                .tournamentId(p.getTournament().getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .athleteName(p.getAthleteName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .status(p.getStatus())
                .formResponses(p.getFormResponses())
                .avatarUrl(avatar)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private TournamentMatchResponse mapToMatchResponse(TournamentMatch m) {
        Long p1Id = m.getParticipant1() != null ? m.getParticipant1().getId() : null;
        String p1Name = m.getParticipant1() != null ? m.getParticipant1().getAthleteName() : "TBD";
        String p1Avatar = m.getParticipant1() != null && m.getParticipant1().getUser() != null ? m.getParticipant1().getUser().getAvatarUrl() : null;

        Long p2Id = m.getParticipant2() != null ? m.getParticipant2().getId() : null;
        String p2Name = m.getParticipant2() != null ? m.getParticipant2().getAthleteName() : "TBD";
        String p2Avatar = m.getParticipant2() != null && m.getParticipant2().getUser() != null ? m.getParticipant2().getUser().getAvatarUrl() : null;

        String winnerName = null;
        if (m.getWinnerParticipantId() != null) {
            if (m.getParticipant1() != null && m.getWinnerParticipantId().equals(m.getParticipant1().getId())) {
                winnerName = m.getParticipant1().getAthleteName();
            } else if (m.getParticipant2() != null && m.getWinnerParticipantId().equals(m.getParticipant2().getId())) {
                winnerName = m.getParticipant2().getAthleteName();
            }
        }

        return TournamentMatchResponse.builder()
                .id(m.getId())
                .tournamentId(m.getTournament().getId())
                .roundName(m.getRoundName())
                .matchNumber(m.getMatchNumber())
                .participant1Id(p1Id)
                .participant1Name(p1Name)
                .participant1Avatar(p1Avatar)
                .participant2Id(p2Id)
                .participant2Name(p2Name)
                .participant2Avatar(p2Avatar)
                .score1(m.getScore1())
                .score2(m.getScore2())
                .winnerParticipantId(m.getWinnerParticipantId())
                .winnerName(winnerName)
                .scheduledTime(m.getScheduledTime())
                .scheduledDate(m.getScheduledDate())
                .courtVenue(m.getCourtVenue())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
