package com.scs.service;

import com.scs.dto.VendorReviewResponse;
import com.scs.entity.Post;
import com.scs.entity.VendorReview;
import com.scs.repository.OrderRepository;
import com.scs.repository.PostRepository;
import com.scs.repository.UserRepository;
import com.scs.repository.VendorRepository;
import com.scs.repository.VendorReviewRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class VendorReviewService {

    private final VendorReviewRepository repo;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final OrderRepository orderRepo;
    private final PostRepository postRepo;

    public VendorReviewService(
            VendorReviewRepository repo,
            UserRepository userRepo,
            VendorRepository vendorRepo,
            OrderRepository orderRepo,
            PostRepository postRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
        this.orderRepo = orderRepo;
        this.postRepo = postRepo;
    }

    /**
     * 创建商家评价：仅打分或打分+评论；评论非空时同步一条食堂圈动态。
     * 整段在同一事务中，避免评价已落库但动态同步失败导致不一致。
     */
    @Transactional(rollbackFor = Exception.class)
    public VendorReviewResponse create(VendorReview entity) {
        if (entity.getId() != null) {
            entity.setId(null);
        }
        if (entity.getContent() != null) {
            String c = entity.getContent().trim();
            entity.setContent(c.isEmpty() ? null : c);
        }
        if (entity.getRating() == null || entity.getRating() < 1 || entity.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (entity.getOrderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        final Long orderId = Objects.requireNonNull(entity.getOrderId());
        final Long userId = entity.getUserId();
        final Long vendorId = entity.getVendorId();

        Object[] rawOrderIds = orderRepo.findUserAndVendorIdsById(orderId).orElse(null);
        if (rawOrderIds == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Object[] orderIds = normalizeOrderOwnership(rawOrderIds);
        Long orderUserId = toLong(orderIds[0]);
        Long orderVendorId = toLong(orderIds[1]);
        if (userId == null || !userId.equals(orderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (vendorId == null || !vendorId.equals(orderVendorId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        userRepo.findById(userId).ifPresentOrElse(entity::setUser, () -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        });
        vendorRepo.findById(vendorId).ifPresentOrElse(entity::setVendor, () -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        });
        orderRepo.findById(orderId).ifPresentOrElse(entity::setOrder, () -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        });

        final VendorReview saved;
        try {
            saved = repo.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }

        orderRepo.findById(orderId).ifPresent(o -> {
            o.setReviewedAt(LocalDateTime.now());
            orderRepo.save(o);
        });

        if (entity.getContent() != null && !entity.getContent().isBlank()) {
            Post post = new Post();
            post.setUserId(userId);
            post.setVendorId(vendorId);
            post.setVendorReviewId(saved.getId());
            post.setContent(entity.getContent().trim());
            post.setPostType("dynamics");
            if (entity.getUser() != null) {
                post.setUser(entity.getUser());
            }
            if (entity.getVendor() != null) {
                post.setVendor(entity.getVendor());
            }
            postRepo.save(post);
        }

        return new VendorReviewResponse(
                saved.getId(),
                saved.getUserId(),
                saved.getVendorId(),
                saved.getOrderId(),
                saved.getRating(),
                saved.getContent(),
                saved.getCreatedAt());
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "invalid order ownership data");
    }

    private Object[] normalizeOrderOwnership(Object[] rawOrderIds) {
        if (rawOrderIds.length >= 2) {
            return rawOrderIds;
        }
        if (rawOrderIds.length == 1 && rawOrderIds[0] instanceof Object[] nested && nested.length >= 2) {
            return nested;
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "invalid order ownership row");
    }
}
