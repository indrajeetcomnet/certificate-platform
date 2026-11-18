package com.certificate.platform.config;

import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import com.certificate.platform.util.PasswordEncoderUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Lazy
@ConditionalOnProperty(name = "app.db.init.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final SponsorRepository sponsorRepository;
    private final BadgeRepository badgeRepository;
    private final SponsorBadgeRepository sponsorBadgeRepository;
    private final PostRepository postRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final MessageRepository messageRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentParticipantRepository tournamentParticipantRepository;
    private final TournamentMatchRepository tournamentMatchRepository;
    private final MentorCreditRepository mentorCreditRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking database seed state...");

        // 1. Seed Institution User and Institution Entity if missing
        Institution athlosInstitution = institutionRepository.findAll().stream().findFirst().orElseGet(() -> {
            User instUser = userRepository.findByUsername("athlos_academy").orElseGet(() -> {
                User u = User.builder()
                        .username("athlos_academy")
                        .email("admin@athlosacademy.org")
                        .displayName("Athlos Sports Academy")
                        .passwordHash(PasswordEncoderUtil.hash("athlos2026"))
                        .role(User.Role.INSTITUTION)
                        .bio("Official Accredited Sports Academy & Tournament Federation")
                        .avatarUrl("https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&h=150&fit=crop&crop=faces")
                        .build();
                return userRepository.save(u);
            });

            Institution inst = Institution.builder()
                    .name("Athlos Sports Academy")
                    .description("Official Accredited Sports Academy & Tournament Federation")
                    .verified(true)
                    .user(instUser)
                    .build();
            return institutionRepository.save(inst);
        });

        // 2. Seed Real Brand Sponsors if empty
        if (sponsorRepository.count() == 0) {
            Sponsor nike = Sponsor.builder()
                    .name("Nike Pro Performance")
                    .tagline("Just Do It · Official Apparel & Track Sponsor")
                    .brandColor("#E11D48")
                    .logoUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop")
                    .websiteUrl("https://nike.com")
                    .budget(new java.math.BigDecimal("50000.00"))
                    .spentAmount(new java.math.BigDecimal("12400.00"))
                    .cpmRate(new java.math.BigDecimal("20.00"))
                    .totalImpressions(620000L)
                    .totalClicks(4820L)
                    .targetCategory("ATHLETICS")
                    .sponsorType("BRAND")
                    .slotNumber(1)
                    .status("ACTIVE")
                    .isActive(true)
                    .campaignStart(LocalDateTime.now())
                    .campaignEnd(LocalDateTime.now().plusMonths(12))
                    .build();
            sponsorRepository.save(nike);

            Sponsor redbull = Sponsor.builder()
                    .name("Red Bull Racing Arena")
                    .tagline("Gives You Wings · High-Octane Endurance & Podium Partner")
                    .brandColor("#1E3A8A")
                    .logoUrl("https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop")
                    .websiteUrl("https://redbull.com")
                    .budget(new java.math.BigDecimal("75000.00"))
                    .spentAmount(new java.math.BigDecimal("18600.00"))
                    .cpmRate(new java.math.BigDecimal("20.00"))
                    .totalImpressions(930000L)
                    .totalClicks(7150L)
                    .targetCategory("ALL")
                    .sponsorType("BRAND")
                    .slotNumber(2)
                    .status("ACTIVE")
                    .isActive(true)
                    .campaignStart(LocalDateTime.now())
                    .campaignEnd(LocalDateTime.now().plusMonths(12))
                    .build();
            sponsorRepository.save(redbull);

            Sponsor puma = Sponsor.builder()
                    .name("Puma Nitro Series")
                    .tagline("Forever Faster · Fast-Paced Track & Football Footwear")
                    .brandColor("#D97706")
                    .logoUrl("https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150&h=150&fit=crop")
                    .websiteUrl("https://puma.com")
                    .budget(new java.math.BigDecimal("35000.00"))
                    .spentAmount(new java.math.BigDecimal("9100.00"))
                    .cpmRate(new java.math.BigDecimal("20.00"))
                    .totalImpressions(455000L)
                    .totalClicks(3290L)
                    .targetCategory("FOOTBALL")
                    .sponsorType("BRAND")
                    .slotNumber(3)
                    .status("ACTIVE")
                    .isActive(true)
                    .campaignStart(LocalDateTime.now())
                    .campaignEnd(LocalDateTime.now().plusMonths(12))
                    .build();
            sponsorRepository.save(puma);
            log.info("Initialized 3 active brand sponsors in database.");
        }

        // Ensure all active sponsors have slot numbers assigned according to availability
        List<Sponsor> allCurrentSponsors = sponsorRepository.findAll();
        for (int i = 0; i < allCurrentSponsors.size(); i++) {
            Sponsor s = allCurrentSponsors.get(i);
            if (s.getSlotNumber() == null) {
                s.setSlotNumber(i + 1);
                sponsorRepository.save(s);
            }
        }

        // 3. Seed Competition Badges if empty
        Badge goldBadge = badgeRepository.findByRank(1).orElse(null);
        Badge silverBadge = badgeRepository.findByRank(2).orElse(null);
        Badge bronzeBadge = badgeRepository.findByRank(3).orElse(null);

        if (goldBadge == null || silverBadge == null || bronzeBadge == null) {
            goldBadge = Badge.builder()
                    .name("Game City")
                    .rank(1)
                    .category("Sports Championship")
                    .description("1st Place Gold Medalist - Game City Tournament")
                    .institution(athlosInstitution)
                    .build();
            goldBadge = badgeRepository.save(goldBadge);

            silverBadge = Badge.builder()
                    .name("Game City")
                    .rank(2)
                    .category("Sports Championship")
                    .description("2nd Place Silver Medalist - Game City Tournament")
                    .institution(athlosInstitution)
                    .build();
            silverBadge = badgeRepository.save(silverBadge);

            bronzeBadge = Badge.builder()
                    .name("Game City")
                    .rank(3)
                    .category("Sports Championship")
                    .description("3rd Place Bronze Medalist - Game City Tournament")
                    .institution(athlosInstitution)
                    .build();
            bronzeBadge = badgeRepository.save(bronzeBadge);

            // Link Sponsors to Badges for 5s rotation
            Sponsor firstSponsor = sponsorRepository.findAll().stream().findFirst().orElse(null);
            if (firstSponsor != null && sponsorBadgeRepository.count() == 0) {
                sponsorBadgeRepository.save(SponsorBadge.builder()
                        .sponsor(firstSponsor)
                        .badge(goldBadge)
                        .priority(1)
                        .isActive(true)
                        .build());
            }
            log.info("Initialized Game City #Rank [1 to 3] badges in database.");
        }

        // 4. Seed Diverse Athlete, Creator & Coach Profiles
        User indrajeet = userRepository.findByUsername("indrajeet").orElseGet(() -> {
            User u = User.builder()
                    .username("indrajeet")
                    .email("indrajeet@athlete.org")
                    .displayName("Indrajeet Patil")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("National 100m Sprint Champion | PB: 10.18s | Track & Field Athlete | 2026 Asian Games Contender")
                    .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });
        if (indrajeet != null && !"Indrajeet Patil".equals(indrajeet.getDisplayName())) {
            indrajeet.setDisplayName("Indrajeet Patil");
            userRepository.save(indrajeet);
        }

        User marcus = userRepository.findByUsername("marcus_vance").orElseGet(() -> {
            User u = User.builder()
                    .username("marcus_vance")
                    .email("marcus@metrofc.org")
                    .displayName("Marcus Vance")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("Professional Football Forward @ Metro FC | 24 League Goals | Golden Boot Contender | High Performance")
                    .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });

        User sarah = userRepository.findByUsername("sarah_chen").orElseGet(() -> {
            User u = User.builder()
                    .username("sarah_chen")
                    .email("sarah@chenbadminton.com")
                    .displayName("Sarah Chen")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("BWF World Tour Competitor | 3x National Singles Badminton Champion | Smash Speed: 372 km/h")
                    .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });

        User rohit = userRepository.findByUsername("rohit_kumar").orElseGet(() -> {
            User u = User.builder()
                    .username("rohit_kumar")
                    .email("rohit@strengthclub.in")
                    .displayName("Rohit Kumar")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("74kg Class National Record Squat & Deadlift | Certified CSCS Strength Coach | Mentoring Next-Gen Lifters")
                    .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });

        User elena = userRepository.findByUsername("elena_rostova").orElseGet(() -> {
            User u = User.builder()
                    .username("elena_rostova")
                    .email("elena@aquatics.org")
                    .displayName("Elena Rostova")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("Olympic Freestyle Swimmer | 200m & 400m Specialist | European Aquatics Gold Medalist | Endurance Specialist")
                    .avatarUrl("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });

        User zack = userRepository.findByUsername("zack_esports").orElseGet(() -> {
            User u = User.builder()
                    .username("zack_esports")
                    .email("zack@pulsefps.gg")
                    .displayName("Zackary Taylor")
                    .passwordHash(PasswordEncoderUtil.hash("userpass2026"))
                    .role(User.Role.USER)
                    .bio("Tactical FPS Pro Athlete & Tournament MVP | VALORANT Masters Contender | Content Creator & Performance Gamer")
                    .avatarUrl("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces")
                    .build();
            return userRepository.save(u);
        });

        // 5. Seed Badge Assignments to Athletes if empty
        if (userBadgeRepository.count() == 0 && goldBadge != null) {
            userBadgeRepository.save(UserBadge.builder()
                    .user(indrajeet)
                    .badge(goldBadge)
                    .awardedBy(athlosInstitution)
                    .awardedAt(LocalDateTime.now().minusDays(3))
                    .build());

            if (silverBadge != null) {
                userBadgeRepository.save(UserBadge.builder()
                        .user(marcus)
                        .badge(silverBadge)
                        .awardedBy(athlosInstitution)
                        .awardedAt(LocalDateTime.now().minusDays(3))
                        .build());
            }

            if (bronzeBadge != null) {
                userBadgeRepository.save(UserBadge.builder()
                        .user(sarah)
                        .badge(bronzeBadge)
                        .awardedBy(athlosInstitution)
                        .awardedAt(LocalDateTime.now().minusDays(3))
                        .build());
            }
            log.info("Assigned official badges to seeded athletes.");
        }

        // 6. Seed Diverse Activity Posts if empty or only 1 announcement
        if (postRepository.count() <= 1) {
            User officialIssuer = userRepository.findByUsername("athlos_academy").orElse(null);
            if (officialIssuer != null && postRepository.count() == 0) {
                postRepository.save(Post.builder()
                        .user(officialIssuer)
                        .content("Official Announcement: Game City National Athletics Invitational is underway! Compete across verified brackets, claim podium rank badges, and monetize sponsor views in real time.")
                        .postType(Post.PostType.ORIGINAL)
                        .likesCount(12)
                        .commentsCount(3)
                        .viewsCount(2400)
                        .build());
            }

            postRepository.save(Post.builder()
                    .user(indrajeet)
                    .content("Broke my personal record in the 100m sprint finals today with 10.18s! Massive thanks to Athlos Sports Academy for the verified Gold Badge honor. Big things coming for the 2026 season!")
                    .postType(Post.PostType.ORIGINAL)
                    .likesCount(48)
                    .commentsCount(9)
                    .viewsCount(18500)
                    .build());

            postRepository.save(Post.builder()
                    .user(marcus)
                    .content("Crucial 3 points on the road! Scored a brace in the second half. Verified credential from the tournament federation is officially logged on my profile.")
                    .postType(Post.PostType.ORIGINAL)
                    .likesCount(35)
                    .commentsCount(4)
                    .viewsCount(14200)
                    .build());

            postRepository.save(Post.builder()
                    .user(sarah)
                    .content("Intense 3-set thriller in the championship semi-finals! Recovering well and focused on tomorrow's final match. Appreciate all the fan support!")
                    .postType(Post.PostType.ORIGINAL)
                    .likesCount(29)
                    .commentsCount(5)
                    .viewsCount(9800)
                    .build());

            log.info("Initialized diverse athlete social feed posts in database.");
        }

        // 7. Seed Initial Direct Messages if empty
        if (messageRepository.count() == 0) {
            User officialIssuer = userRepository.findByUsername("athlos_academy").orElse(null);

            if (officialIssuer != null) {
                messageRepository.save(Message.builder()
                        .sender(officialIssuer)
                        .recipient(indrajeet)
                        .content("Congratulations Indrajeet! Your official accreditation certificate and Gold Badge for the National Invitational have been cryptographically verified and issued.")
                        .isRead(true)
                        .readAt(LocalDateTime.now().minusHours(4))
                        .build());

                messageRepository.save(Message.builder()
                        .sender(indrajeet)
                        .recipient(officialIssuer)
                        .content("Thank you Athlos Sports Academy! Honored to represent in the finals. Looking forward to the tournament showcase.")
                        .isRead(true)
                        .readAt(LocalDateTime.now().minusHours(3))
                        .build());
            }

            messageRepository.save(Message.builder()
                    .sender(marcus)
                    .recipient(indrajeet)
                    .content("Incredible sprint in the 100m finals man! Catch you on the podium next month!")
                    .isRead(false)
                    .build());

            messageRepository.save(Message.builder()
                    .sender(sarah)
                    .recipient(indrajeet)
                    .content("Hey Indrajeet, are you competing at the Asian Athletics qualifiers next week?")
                    .isRead(false)
                    .build());

            log.info("Initialized initial direct message threads in database.");
        }

        // 8. Seed Flagship Tournament with Google-Form custom schema and timetable if empty
        if (tournamentRepository.count() == 0 && athlosInstitution != null) {
            String formSchema = "[" +
                    "{\"id\":\"bib_number\",\"label\":\"Bib / Chest Number\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g. 101\"}," +
                    "{\"id\":\"age_category\",\"label\":\"Age Category\",\"type\":\"select\",\"required\":true,\"options\":[\"Under-18\",\"Senior Elite (18-29)\",\"Masters (30+)\"],\"placeholder\":\"Select Category\"}," +
                    "{\"id\":\"personal_best\",\"label\":\"Official 100m Personal Best\",\"type\":\"text\",\"required\":false,\"placeholder\":\"e.g. 10.18s\"}," +
                    "{\"id\":\"medical_clearance\",\"label\":\"Certified Medically Fit to Compete\",\"type\":\"checkbox\",\"required\":true,\"placeholder\":\"Certified\"}" +
                    "]";

            Tournament t = Tournament.builder()
                    .title("Game City Athletics Championship 2026")
                    .description("The premier regional track and field championship organized by Athlos Sports Academy. Official medals and cryptographically verified credentials awarded to podium finishers.")
                    .sport("Track & Field")
                    .format("Single Elimination Sprint Heats")
                    .venue("National Athletic Stadium, Track 4")
                    .startDate("2026-11-20")
                    .endDate("2026-11-22")
                    .registrationDeadline("2026-11-19")
                    .status("LIVE")
                    .maxParticipants(16)
                    .institution(athlosInstitution)
                    .customFormSchema(formSchema)
                    .linkedBadgeGoldId(goldBadge != null ? goldBadge.getId() : null)
                    .linkedBadgeSilverId(silverBadge != null ? silverBadge.getId() : null)
                    .linkedBadgeBronzeId(bronzeBadge != null ? bronzeBadge.getId() : null)
                    .linkedCertificateTemplate("CHAMPIONSHIP_GOLD")
                    .build();

            t = tournamentRepository.save(t);

            // Seed 4 participants with custom Google-Form responses
            TournamentParticipant tp1 = tournamentParticipantRepository.save(TournamentParticipant.builder()
                    .tournament(t)
                    .user(indrajeet)
                    .athleteName("Indrajeet Patil")
                    .email("indrajeet@athlete.org")
                    .phone("+91 98765 43210")
                    .status("CONFIRMED")
                    .formResponses("{\"bib_number\":\"101\",\"age_category\":\"Senior Elite (18-29)\",\"personal_best\":\"10.18s\",\"medical_clearance\":\"true\"}")
                    .build());

            TournamentParticipant tp2 = tournamentParticipantRepository.save(TournamentParticipant.builder()
                    .tournament(t)
                    .user(marcus)
                    .athleteName("Marcus Vance")
                    .email("marcus@athlete.org")
                    .phone("+91 98765 43211")
                    .status("CONFIRMED")
                    .formResponses("{\"bib_number\":\"104\",\"age_category\":\"Senior Elite (18-29)\",\"personal_best\":\"10.35s\",\"medical_clearance\":\"true\"}")
                    .build());

            TournamentParticipant tp3 = tournamentParticipantRepository.save(TournamentParticipant.builder()
                    .tournament(t)
                    .user(sarah)
                    .athleteName("Sarah Chen")
                    .email("sarah@athlete.org")
                    .phone("+91 98765 43212")
                    .status("CONFIRMED")
                    .formResponses("{\"bib_number\":\"108\",\"age_category\":\"Senior Elite (18-29)\",\"personal_best\":\"10.42s\",\"medical_clearance\":\"true\"}")
                    .build());

            TournamentParticipant tp4 = tournamentParticipantRepository.save(TournamentParticipant.builder()
                    .tournament(t)
                    .user(rohit)
                    .athleteName("Rohit Kumar")
                    .email("rohit@athlete.org")
                    .phone("+91 98765 43213")
                    .status("CONFIRMED")
                    .formResponses("{\"bib_number\":\"112\",\"age_category\":\"Senior Elite (18-29)\",\"personal_best\":\"10.55s\",\"medical_clearance\":\"true\"}")
                    .build());

            // Seed matches timetable: Semi-Finals completed, Grand Final LIVE
            tournamentMatchRepository.save(TournamentMatch.builder()
                    .tournament(t)
                    .roundName("Semi-Final Heat 1")
                    .matchNumber(1)
                    .participant1(tp1)
                    .participant2(tp4)
                    .score1("10.18s")
                    .score2("10.55s")
                    .winnerParticipantId(tp1.getId())
                    .scheduledDate("2026-11-20")
                    .scheduledTime("10:00 AM")
                    .courtVenue("Track 4 - Lane 3 & 4")
                    .status("COMPLETED")
                    .build());

            tournamentMatchRepository.save(TournamentMatch.builder()
                    .tournament(t)
                    .roundName("Semi-Final Heat 2")
                    .matchNumber(2)
                    .participant1(tp2)
                    .participant2(tp3)
                    .score1("10.35s")
                    .score2("10.42s")
                    .winnerParticipantId(tp2.getId())
                    .scheduledDate("2026-11-20")
                    .scheduledTime("10:30 AM")
                    .courtVenue("Track 4 - Lane 3 & 4")
                    .status("COMPLETED")
                    .build());

            tournamentMatchRepository.save(TournamentMatch.builder()
                    .tournament(t)
                    .roundName("Grand Final Gold Sprint")
                    .matchNumber(3)
                    .participant1(tp1)
                    .participant2(tp2)
                    .score1("")
                    .score2("")
                    .scheduledDate("2026-11-20")
                    .scheduledTime("04:30 PM")
                    .courtVenue("Track 4 - Championship Center Lane")
                    .status("LIVE")
                    .build());

            log.info("Initialized flagship tournament 'Game City Athletics Championship 2026' with Google-Form schema and live timetable.");
        }

        // 9. Seed Initial Teacher/Coach Credit if empty
        if (mentorCreditRepository.count() == 0 && indrajeet != null && rohit != null) {
            mentorCreditRepository.save(MentorCredit.builder()
                    .athlete(indrajeet)
                    .mentor(rohit)
                    .roleTitle("Strength & Performance Coach")
                    .build());
            log.info("Initialized initial mentor credit: Indrajeet Patil credited Rohit Kumar as coach.");
        }
    }
}
