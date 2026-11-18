package com.certificate.platform.controller;

import com.certificate.platform.dto.*;
import com.certificate.platform.model.TournamentMatch;
import com.certificate.platform.service.TournamentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments(
            @RequestParam(required = false) Long institutionId) {
        if (institutionId != null) {
            return ResponseEntity.ok(tournamentService.getTournamentsByInstitution(institutionId));
        }
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getTournamentById(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournamentById(id));
    }

    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(
            @Valid @RequestBody CreateTournamentRequest request,
            HttpServletRequest httpRequest) {
        Long currentUserId = httpRequest != null ? (Long) httpRequest.getAttribute("currentUserId") : 1L;
        TournamentResponse response = tournamentService.createTournament(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable Long id,
            @Valid @RequestBody CreateTournamentRequest request) {
        return ResponseEntity.ok(tournamentService.updateTournament(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<TournamentParticipantResponse> registerParticipant(
            @PathVariable Long id,
            @Valid @RequestBody RegisterParticipantRequest request,
            HttpServletRequest httpRequest) {
        Long currentUserId = httpRequest != null ? (Long) httpRequest.getAttribute("currentUserId") : null;
        TournamentParticipantResponse response = tournamentService.registerParticipant(id, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/participants/{participantId}")
    public ResponseEntity<TournamentParticipantResponse> updateParticipantStatus(
            @PathVariable Long id,
            @PathVariable Long participantId,
            @RequestParam String status) {
        return ResponseEntity.ok(tournamentService.updateParticipantStatus(id, participantId, status));
    }

    @PostMapping("/{id}/matches")
    public ResponseEntity<TournamentMatchResponse> createMatch(
            @PathVariable Long id,
            @RequestBody TournamentMatch match) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tournamentService.createMatch(id, match));
    }

    @PutMapping("/{id}/matches/{matchId}/score")
    public ResponseEntity<TournamentMatchResponse> updateMatchScore(
            @PathVariable Long id,
            @PathVariable Long matchId,
            @RequestBody UpdateMatchScoreRequest request) {
        return ResponseEntity.ok(tournamentService.updateMatchScore(id, matchId, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TournamentResponse> updateTournamentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(tournamentService.updateTournamentStatus(id, status));
    }

    @PostMapping("/{id}/participants/bulk")
    public ResponseEntity<List<TournamentParticipantResponse>> bulkRegisterParticipants(
            @PathVariable Long id,
            @RequestBody List<RegisterParticipantRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tournamentService.bulkRegisterParticipants(id, requests));
    }

    @PostMapping("/{id}/generate-fixtures")
    public ResponseEntity<List<TournamentMatchResponse>> generateFixtures(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.generateFixtures(id));
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<TournamentResponse> finalizeTournament(
            @PathVariable Long id,
            @RequestBody FinalizeTournamentRequest request) {
        return ResponseEntity.ok(tournamentService.finalizeTournament(id, request));
    }
}
