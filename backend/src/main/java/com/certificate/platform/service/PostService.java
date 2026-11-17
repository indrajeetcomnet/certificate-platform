package com.certificate.platform.service;

import com.certificate.platform.dto.*;
import com.certificate.platform.exception.BadRequestException;
import com.certificate.platform.exception.ResourceNotFoundException;
import com.certificate.platform.model.*;
import com.certificate.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final SponsorBadgeRepository sponsorBadgeRepository;

    @Transactional
    public PostResponse createPost(CreatePostRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Post post = Post.builder()
                .content(request.getContent())
                .user(user)
                .postType(request.getPostType() != null ? request.getPostType() : Post.PostType.ORIGINAL)
                .likesCount(0)
                .commentsCount(0)
                .viewsCount(0)
                .build();

        if (request.getParentPostId() != null) {
            Post parentPost = postRepository.findById(request.getParentPostId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent post", request.getParentPostId()));
            post.setParentPost(parentPost);
            post.setPostType(Post.PostType.FOLLOWUP);
        }

        post = postRepository.save(post);

        if (request.getMediaUrls() != null && !request.getMediaUrls().isEmpty()) {
            final Post savedPost = post;
            for (int i = 0; i < request.getMediaUrls().size(); i++) {
                PostMedia media = PostMedia.builder()
                        .post(savedPost)
                        .mediaUrl(request.getMediaUrls().get(i))
                        .mediaType(PostMedia.MediaType.IMAGE)
                        .displayOrder(i)
                        .build();
                postMediaRepository.save(media);
            }
        }

        return mapToPostResponse(post);
    }

    public Page<PostResponse> getFeed(Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToPostResponse);
    }

    public PostResponse getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        return mapToPostResponse(post);
    }

    public List<PostResponse> getFollowUpPosts(Long postId) {
        return postRepository.findByParentPostId(postId).stream()
                .map(this::mapToPostResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void likePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!likeRepository.existsByUserIdAndPostId(userId, postId)) {
            Like like = Like.builder().user(user).post(post).build();
            likeRepository.save(like);
            post.setLikesCount(post.getLikesCount() + 1);
            postRepository.save(post);
        }
    }

    @Transactional
    public void unlikePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        likeRepository.findByUserIdAndPostId(userId, postId).ifPresent(like -> {
            likeRepository.delete(like);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            postRepository.save(post);
        });
    }

    public List<CommentResponse> getComments(Long postId) {
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(Long postId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        if (request.getUserId() == null) {
            throw new BadRequestException("User ID is required to add a comment");
        }
        Long userId = request.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .user(user)
                .post(post)
                .likesCount(0)
                .build();
        comment = commentRepository.save(comment);

        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        return mapToCommentResponse(comment);
    }

    @Transactional
    public int incrementViewsCount(Long postId) {
        return postRepository.incrementViewsCount(postId);
    }

    public List<PostResponse> getUserPosts(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToPostResponse)
                .collect(Collectors.toList());
    }

    private PostResponse mapToPostResponse(Post post) {
        List<PostMedia> mediaList = postMediaRepository.findByPostIdOrderByDisplayOrderAsc(post.getId());
        List<UserBadge> userBadges = (post.getUser() != null && post.getUser().getId() != null)
                ? userBadgeRepository.findByUserId(post.getUser().getId())
                : Collections.emptyList();

        List<SponsorBadge> allSponsorBadges = new ArrayList<>();
        for (UserBadge ub : userBadges) {
            if (ub.getBadge() != null && ub.getBadge().getId() != null) {
                List<SponsorBadge> activeLinks = sponsorBadgeRepository.findByBadgeIdAndIsActiveTrue(ub.getBadge().getId());
                if (activeLinks != null) {
                    allSponsorBadges.addAll(activeLinks);
                }
            }
        }

        Map<Long, Sponsor> distinctSponsors = new LinkedHashMap<>();
        allSponsorBadges.stream()
                .filter(sb -> sb.getSponsor() != null && !Boolean.FALSE.equals(sb.getSponsor().getIsActive()))
                .sorted(Comparator.comparingInt((SponsorBadge sb) -> sb.getPriority() != null ? sb.getPriority() : 0).reversed())
                .forEach(sb -> distinctSponsors.putIfAbsent(sb.getSponsor().getId(), sb.getSponsor()));

        List<SponsorResponse> sponsors = distinctSponsors.values().stream()
                .map(this::mapToSponsorResponse)
                .collect(Collectors.toList());

        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .user(PostResponse.UserSummary.builder()
                        .id(post.getUser().getId())
                        .username(post.getUser().getUsername())
                        .displayName(post.getUser().getDisplayName())
                        .avatarUrl(post.getUser().getAvatarUrl())
                        .build())
                .parentPostId(post.getParentPost() != null ? post.getParentPost().getId() : null)
                .postType(post.getPostType())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .viewsCount(post.getViewsCount())
                .media(mediaList.stream()
                        .map(m -> PostResponse.MediaResponse.builder()
                                .id(m.getId())
                                .mediaUrl(m.getMediaUrl())
                                .mediaType(m.getMediaType().name())
                                .displayOrder(m.getDisplayOrder())
                                .build())
                        .collect(Collectors.toList()))
                .userBadges(userBadges.stream()
                        .map(ub -> UserBadgeResponse.builder()
                                .id(ub.getId())
                                .badge(BadgeResponse.builder()
                                        .id(ub.getBadge().getId())
                                        .name(ub.getBadge().getName())
                                        .rank(ub.getBadge().getRank())
                                        .rankDisplay(getRankDisplay(ub.getBadge().getRank()))
                                        .category(ub.getBadge().getCategory())
                                        .iconUrl(ub.getBadge().getIconUrl())
                                        .build())
                                .awardedAt(ub.getAwardedAt())
                                .awardedByInstitutionName(ub.getAwardedBy() != null ? ub.getAwardedBy().getName() : null)
                                .build())
                        .collect(Collectors.toList()))
                .sponsors(sponsors)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private SponsorResponse mapToSponsorResponse(Sponsor sponsor) {
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

    private CommentResponse mapToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .user(PostResponse.UserSummary.builder()
                        .id(comment.getUser().getId())
                        .username(comment.getUser().getUsername())
                        .displayName(comment.getUser().getDisplayName())
                        .avatarUrl(comment.getUser().getAvatarUrl())
                        .build())
                .postId(comment.getPost().getId())
                .likesCount(comment.getLikesCount())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private String getRankDisplay(Integer rank) {
        return switch (rank) {
            case 1 -> "Gold";
            case 2 -> "Silver";
            case 3 -> "Bronze";
            default -> "Rank " + rank;
        };
    }
}
