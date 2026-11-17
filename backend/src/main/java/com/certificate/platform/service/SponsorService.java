package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Sponsor sponsor = Sponsor.builder()
                .name(request.getName())
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .bannerImageUrl(request.getBannerImageUrl())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .campaignStart(request.getCampaignStart())
                .campaignEnd(request.getCampaignEnd())
                .build();
        sponsor = sponsorRepository.save(sponsor);
        return mapToResponse(sponsor);
    }

    public SponsorResponse getSponsor(Long id) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));
        return mapToResponse(sponsor);
    }

    public List<SponsorResponse> getAllSponsors() {
        return sponsorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SponsorResponse updateSponsor(Long id, CreateSponsorRequest request) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor", id));

        sponsor.setName(request.getName());
        sponsor.setLogoUrl(request.getLogoUrl());
        sponsor.setWebsiteUrl(request.getWebsiteUrl());
        sponsor.setBannerImageUrl(request.getBannerImageUrl());
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
                .logoUrl(sponsor.getLogoUrl())
                .websiteUrl(sponsor.getWebsiteUrl())
                .bannerImageUrl(sponsor.getBannerImageUrl())
                .isActive(sponsor.getIsActive())
                .campaignStart(sponsor.getCampaignStart())
                .campaignEnd(sponsor.getCampaignEnd())
                .createdAt(sponsor.getCreatedAt())
                .build();
    }
}
