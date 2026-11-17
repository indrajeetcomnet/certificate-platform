package com.certificate.platform.service;

import com.certificate.platform.dto.EarningsSummary;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.Earning;
import com.certificate.platform.model.Sponsor;
import com.certificate.platform.model.ViewEvent;
import com.certificate.platform.repository.EarningRepository;
import com.certificate.platform.repository.SponsorRepository;
import com.certificate.platform.repository.UserRepository;
import com.certificate.platform.repository.ViewEventRepository;
import com.certificate.platform.util.ViewCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EarningService {

    private final EarningRepository earningRepository;
    private final UserRepository userRepository;
    private final SponsorRepository sponsorRepository;
    private final ViewEventRepository viewEventRepository;

    @Transactional
    public EarningsSummary calculateEarnings(Long userId, String period) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        YearMonth ym = YearMonth.parse(period, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);

        List<Sponsor> sponsors = sponsorRepository.findByIsActiveTrue();
        List<EarningsSummary.SponsorEarning> breakdown = new ArrayList<>();
        long totalViews = 0;
        BigDecimal totalEarnings = BigDecimal.ZERO;

        for (Sponsor sponsor : sponsors) {
            List<ViewEvent> views = viewEventRepository.findQualifyingViewsByUser(
                    userId, sponsor.getId(), start, end);
            long qualifyingViews = ViewCalculator.countQualifyingViews(views);

            if (qualifyingViews > 0) {
                BigDecimal amount = ViewCalculator.calculateEarnings(qualifyingViews);

                // Save or update earning record
                Earning earning = Earning.builder()
                        .user(userRepository.getReferenceById(userId))
                        .sponsor(sponsor)
                        .totalViews(qualifyingViews)
                        .earnedAmount(amount)
                        .period(period)
                        .calculatedAt(LocalDateTime.now())
                        .build();
                earningRepository.save(earning);

                breakdown.add(EarningsSummary.SponsorEarning.builder()
                        .sponsorId(sponsor.getId())
                        .sponsorName(sponsor.getName())
                        .views(qualifyingViews)
                        .amount(amount)
                        .build());

                totalViews += qualifyingViews;
                totalEarnings = totalEarnings.add(amount);
            }
        }

        return EarningsSummary.builder()
                .userId(userId)
                .totalViews(totalViews)
                .totalEarnings(totalEarnings.setScale(2, RoundingMode.HALF_UP))
                .period(period)
                .sponsorBreakdown(breakdown)
                .build();
    }

    public EarningsSummary getEarningsSummary(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // 1. Calculate live real-time earnings from viewEventRepository
        List<Sponsor> activeSponsors = sponsorRepository.findByIsActiveTrue();
        List<EarningsSummary.SponsorEarning> liveBreakdown = new ArrayList<>();
        long liveTotalViews = 0;
        BigDecimal liveTotalEarnings = BigDecimal.ZERO;

        if (activeSponsors != null) {
            for (Sponsor sponsor : activeSponsors) {
                List<ViewEvent> sponsorViews = viewEventRepository.findAllQualifyingViewsByUserAndSponsor(userId, sponsor.getId());
                long qualifyingViews = ViewCalculator.countQualifyingViews(sponsorViews);
                if (qualifyingViews > 0) {
                    BigDecimal amount = ViewCalculator.calculateEarnings(qualifyingViews);
                    liveBreakdown.add(EarningsSummary.SponsorEarning.builder()
                            .sponsorId(sponsor.getId())
                            .sponsorName(sponsor.getName())
                            .views(qualifyingViews)
                            .amount(amount)
                            .build());
                    liveTotalViews += qualifyingViews;
                    liveTotalEarnings = liveTotalEarnings.add(amount);
                }
            }
        }

        // Account for any additional qualifying creator views
        List<ViewEvent> allUserViews = viewEventRepository.findAllQualifyingViewsByUser(userId);
        long allQualifyingViews = ViewCalculator.countQualifyingViews(allUserViews);
        if (allQualifyingViews > liveTotalViews) {
            long unassignedViews = allQualifyingViews - liveTotalViews;
            BigDecimal unassignedAmount = ViewCalculator.calculateEarnings(unassignedViews);
            liveBreakdown.add(EarningsSummary.SponsorEarning.builder()
                    .sponsorId(null)
                    .sponsorName("Creator Network Views")
                    .views(unassignedViews)
                    .amount(unassignedAmount)
                    .build());
            liveTotalViews = allQualifyingViews;
            liveTotalEarnings = liveTotalEarnings.add(unassignedAmount);
        }

        // 2. Query pre-calculated earnings table
        List<Earning> preCalculatedEarnings = earningRepository.findByUserIdOrderByCalculatedAtDesc(userId);
        long preCalcViews = 0;
        BigDecimal preCalcAmount = BigDecimal.ZERO;
        List<EarningsSummary.SponsorEarning> preCalcBreakdown = new ArrayList<>();
        if (preCalculatedEarnings != null) {
            for (Earning e : preCalculatedEarnings) {
                preCalcBreakdown.add(EarningsSummary.SponsorEarning.builder()
                        .sponsorId(e.getSponsor() != null ? e.getSponsor().getId() : null)
                        .sponsorName(e.getSponsor() != null ? e.getSponsor().getName() : "Sponsor")
                        .views(e.getTotalViews() != null ? e.getTotalViews() : 0L)
                        .amount(e.getEarnedAmount() != null ? e.getEarnedAmount() : BigDecimal.ZERO)
                        .build());
                preCalcViews += (e.getTotalViews() != null ? e.getTotalViews() : 0L);
                preCalcAmount = preCalcAmount.add(e.getEarnedAmount() != null ? e.getEarnedAmount() : BigDecimal.ZERO);
            }
        }

        String currentPeriod = DateTimeFormatter.ofPattern("yyyy-MM").format(YearMonth.now());

        // Prefer live real-time views if available or if pre-calculated records are missing/outdated
        if (liveTotalViews >= preCalcViews && (liveTotalViews > 0 || preCalcViews == 0)) {
            return EarningsSummary.builder()
                    .userId(userId)
                    .totalViews(liveTotalViews)
                    .totalEarnings(liveTotalEarnings.setScale(2, RoundingMode.HALF_UP))
                    .period(currentPeriod)
                    .sponsorBreakdown(liveBreakdown)
                    .build();
        }

        return EarningsSummary.builder()
                .userId(userId)
                .totalViews(preCalcViews)
                .totalEarnings(preCalcAmount.setScale(2, RoundingMode.HALF_UP))
                .period(currentPeriod)
                .sponsorBreakdown(preCalcBreakdown)
                .build();
    }
}
