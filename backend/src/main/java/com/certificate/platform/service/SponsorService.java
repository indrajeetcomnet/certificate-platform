package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final SponsorBadgeRepository sponsorBadgeRepository;
    private final BadgeRepository badgeRepository;

    @Transactional
    public SponsorResponse createSponsor(CreateSponsorRequest request) {
        return createSponsor(request, null);
    }

    @Transactional
    public SponsorResponse createSponsor(CreateSponsorRequest request, User currentUser) {
        // Enforce user rule: institutions create certificates and tournament awards, not sponsorships
        if (currentUser != null && currentUser.getRole() == User.Role.INSTITUTION) {
            throw new IllegalArgumentException(
                    "Institutions are accredited certificate and tournament award issuers. " +
                    "Sponsorship campaigns must be created by brands, fans, creators, or commercial sponsors."
            );
        }

        BigDecimal budget = request.getBudget() != null ? request.getBudget() : new BigDecimal("1000.00");
        BigDecimal cpmRate = request.getCpmRate() != null ? request.getCpmRate() : new BigDecimal("20.00");

        Long createdById = currentUser != null ? currentUser.getId() : null;
        String createdByName = currentUser != null
                ? (currentUser.getDisplayName() != null ? currentUser.getDisplayName() : currentUser.getUsername())
                : (request.getName() != null ? request.getName() : "Independent Brand Sponsor");

        // Allot next available slot (1 to 10)
        List<Integer> occupiedSlots = sponsorRepository.findByIsActiveTrue().stream()
                .map(Sponsor::getSlotNumber)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        int allottedSlot = 1;
        while (occupiedSlots.contains(allottedSlot)) {
            allottedSlot++;
        }

        Sponsor sponsor = Sponsor.builder()
                .name(request.getName())
                .tagline(request.getTagline() != null ? request.getTagline() : "Supporting competitive athletes & tournament champions")
                .brandColor(request.getBrandColor() != null && !request.getBrandColor().isBlank() ? request.getBrandColor() : "#E11D48")
                .logoUrl(request.getLogoUrl() != null && !request.getLogoUrl().isBlank()
                        ? request.getLogoUrl()
                        : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop")
                .websiteUrl(request.getWebsiteUrl() != null && !request.getWebsiteUrl().isBlank()
                        ? request.getWebsiteUrl()
                        : "https://example.com/sponsor")
                .bannerImageUrl(request.getBannerImageUrl())
                .budget(budget)
                .spentAmount(BigDecimal.ZERO)
                .cpmRate(cpmRate)
                .totalImpressions(0L)
                .totalClicks(0L)
                .targetCategory(request.getTargetCategory() != null ? request.getTargetCategory() : "ALL")
                .sponsorType(request.getSponsorType() != null ? request.getSponsorType() : "BRAND")
                .slotNumber(allottedSlot)
                .createdById(createdById)
                .createdByName(createdByName)
                .status("ACTIVE")
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .campaignStart(request.getCampaignStart())
                .campaignEnd(request.getCampaignEnd())
                .build();

        sponsor = sponsorRepository.save(sponsor);

        // Auto-link to targeted badge if provided, or attach to existing active badges for immediate rotation
        if (request.getTargetBadgeId() != null) {
            Badge badge = badgeRepository.findById(request.getTargetBadgeId()).orElse(null);
            if (badge != null) {
                sponsorBadgeRepository.save(SponsorBadge.builder()
                        .sponsor(sponsor)
                        .badge(badge)
                        .priority(10)
                        .isActive(true)
                        .build());
            }
        } else {
            // Attach to existing badges so the new sponsor immediately participates in live feed rotation
            List<Badge> existingBadges = badgeRepository.findAll();
            for (Badge b : existingBadges) {
                sponsorBadgeRepository.save(SponsorBadge.builder()
                        .sponsor(sponsor)
                        .badge(b)
                        .priority(5)
                        .isActive(true)
                        .build());
            }
        }

        return mapToResponse(sponsor);
    }

    public SponsorResponse getSponsor(Long id) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        return mapToResponse(sponsor);
    }

    public List<SponsorResponse> getAllSponsors() {
        List<Sponsor> list = sponsorRepository.findAllByOrderByCreatedAtDesc();
        if (list == null || list.isEmpty()) {
            list = sponsorRepository.findAll();
        }
        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SponsorResponse> getMySponsors(Long userId) {
        return sponsorRepository.findByCreatedByIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SponsorResponse recordClick(Long id) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        long clicks = sponsor.getTotalClicks() != null ? sponsor.getTotalClicks() + 1L : 1L;
        sponsor.setTotalClicks(clicks);
        sponsor = sponsorRepository.save(sponsor);
        return mapToResponse(sponsor);
    }

    @Transactional
    public SponsorResponse toggleStatus(Long id, User currentUser) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        
        if ("ACTIVE".equalsIgnoreCase(sponsor.getStatus())) {
            sponsor.setStatus("PAUSED");
            sponsor.setIsActive(false);
        } else {
            sponsor.setStatus("ACTIVE");
            sponsor.setIsActive(true);
        }
        sponsor = sponsorRepository.save(sponsor);
        return mapToResponse(sponsor);
    }

    @Transactional
    public SponsorResponse addBudget(Long id, BigDecimal amount) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        
        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentBudget = sponsor.getBudget() != null ? sponsor.getBudget() : BigDecimal.ZERO;
            sponsor.setBudget(currentBudget.add(amount));
            if ("COMPLETED".equalsIgnoreCase(sponsor.getStatus()) || "PAUSED".equalsIgnoreCase(sponsor.getStatus())) {
                sponsor.setStatus("ACTIVE");
                sponsor.setIsActive(true);
            }
            sponsor = sponsorRepository.save(sponsor);
        }
        return mapToResponse(sponsor);
    }

    @Transactional
    public SponsorResponse updateSponsor(Long id, CreateSponsorRequest request) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));

        sponsor.setName(request.getName());
        if (request.getTagline() != null) sponsor.setTagline(request.getTagline());
        if (request.getBrandColor() != null) sponsor.setBrandColor(request.getBrandColor());
        sponsor.setLogoUrl(request.getLogoUrl());
        sponsor.setWebsiteUrl(request.getWebsiteUrl());
        sponsor.setBannerImageUrl(request.getBannerImageUrl());
        if (request.getBudget() != null) sponsor.setBudget(request.getBudget());
        if (request.getCpmRate() != null) sponsor.setCpmRate(request.getCpmRate());
        if (request.getTargetCategory() != null) sponsor.setTargetCategory(request.getTargetCategory());
        if (request.getSponsorType() != null) sponsor.setSponsorType(request.getSponsorType());
        if (request.getIsActive() != null) sponsor.setIsActive(request.getIsActive());
        sponsor.setCampaignStart(request.getCampaignStart());
        sponsor.setCampaignEnd(request.getCampaignEnd());

        sponsor = sponsorRepository.save(sponsor);
        return mapToResponse(sponsor);
    }

    @Transactional
    public void deleteSponsor(Long id) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        sponsorRepository.delete(sponsor);
    }

    @Transactional
    public SponsorBadgeResponse linkBadge(Long sponsorId, LinkBadgeRequest request) {
        Sponsor sponsor = sponsorRepository.findById(sponsorId)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", sponsorId));
        Badge badge = badgeRepository.findById(request.getBadgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge", request.getBadgeId()));

        SponsorBadge sponsorBadge = SponsorBadge.builder()
                .sponsor(sponsor)
                .badge(badge)
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .isActive(true)
                .build();

        sponsorBadge = sponsorBadgeRepository.save(sponsorBadge);

        return SponsorBadgeResponse.builder()
                .id(sponsorBadge.getId())
                .sponsorId(sponsor.getId())
                .sponsorName(sponsor.getName())
                .sponsorLogoUrl(sponsor.getLogoUrl())
                .sponsorBannerImageUrl(sponsor.getBannerImageUrl())
                .sponsorWebsiteUrl(sponsor.getWebsiteUrl())
                .priority(sponsorBadge.getPriority())
                .badgeId(badge.getId())
                .badgeName(badge.getName())
                .build();
    }

    public List<SponsorBadgeResponse> getActiveSponsorBadges(Long sponsorId) {
        return sponsorBadgeRepository.findBySponsorIdAndIsActiveTrue(sponsorId).stream()
                .map(sb -> SponsorBadgeResponse.builder()
                        .id(sb.getId())
                        .sponsorId(sb.getSponsor().getId())
                        .sponsorName(sb.getSponsor().getName())
                        .sponsorLogoUrl(sb.getSponsor().getLogoUrl())
                        .brandColor(sb.getSponsor().getBrandColor() != null ? sb.getSponsor().getBrandColor() : "#E11D48")
                        .sponsorBannerImageUrl(sb.getSponsor().getBannerImageUrl())
                        .sponsorWebsiteUrl(sb.getSponsor().getWebsiteUrl())
                        .priority(sb.getPriority())
                        .badgeId(sb.getBadge().getId())
                        .badgeName(sb.getBadge().getName())
                        .build())
                .collect(Collectors.toList());
    }

    private SponsorResponse mapToResponse(Sponsor sponsor) {
        return SponsorResponse.builder()
                .id(sponsor.getId())
                .name(sponsor.getName())
                .tagline(sponsor.getTagline())
                .brandColor(sponsor.getBrandColor() != null ? sponsor.getBrandColor() : "#E11D48")
                .logoUrl(sponsor.getLogoUrl())
                .websiteUrl(sponsor.getWebsiteUrl())
                .bannerImageUrl(sponsor.getBannerImageUrl())
                .budget(sponsor.getBudget() != null ? sponsor.getBudget() : BigDecimal.ZERO)
                .spentAmount(sponsor.getSpentAmount() != null ? sponsor.getSpentAmount() : BigDecimal.ZERO)
                .cpmRate(sponsor.getCpmRate() != null ? sponsor.getCpmRate() : new BigDecimal("20.00"))
                .totalImpressions(sponsor.getTotalImpressions() != null ? sponsor.getTotalImpressions() : 0L)
                .totalClicks(sponsor.getTotalClicks() != null ? sponsor.getTotalClicks() : 0L)
                .targetCategory(sponsor.getTargetCategory() != null ? sponsor.getTargetCategory() : "ALL")
                .sponsorType(sponsor.getSponsorType() != null ? sponsor.getSponsorType() : "BRAND")
                .slotNumber(sponsor.getSlotNumber())
                .createdById(sponsor.getCreatedById())
                .createdByName(sponsor.getCreatedByName() != null ? sponsor.getCreatedByName() : "Brand Sponsor")
                .status(sponsor.getStatus() != null ? sponsor.getStatus() : (Boolean.TRUE.equals(sponsor.getIsActive()) ? "ACTIVE" : "PAUSED"))
                .isActive(sponsor.getIsActive())
                .campaignStart(sponsor.getCampaignStart())
                .campaignEnd(sponsor.getCampaignEnd())
                .createdAt(sponsor.getCreatedAt())
                .build();
    }
}
