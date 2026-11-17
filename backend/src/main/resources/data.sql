-- Synthetic Seed Data

-- Users (password hash for "password123")
INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at)
VALUES 
(1, 'demo_user', 'demo_user@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Qv7o8nCqM1vY1X4g6A6s5e9d9b6m6i', 'Demo User', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 'Software engineer & lifelong learner.', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'apex_institute', 'institute@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Qv7o8nCqM1vY1X4g6A6s5e9d9b6m6i', 'Apex Institute of Technology', 'https://images.unsplash.com/photo-1562774053-701939374585?w=150', 'Premier educational institution providing certified courses.', 'INSTITUTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'admin_user', 'admin@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Qv7o8nCqM1vY1X4g6A6s5e9d9b6m6i', 'Platform Administrator', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'System administrator.', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Institutions
INSERT INTO institutions (id, name, description, logo_url, verified, user_id, created_at, updated_at)
VALUES
(1, 'Apex Institute of Technology', 'Leading accreditation and certification body for digital skills and sports.', 'https://images.unsplash.com/photo-1562774053-701939374585?w=150', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Badges
INSERT INTO badges (id, name, rank, category, institution_id, icon_url, description, created_at, updated_at)
VALUES
(1, 'Game City Champion', 1, 'Sports', 1, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100', 'Top ranked athlete in city championship.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Code Master', 2, 'Technology', 1, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100', 'Advanced algorithmic problem solver.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Design Excellence', 3, 'Design', 1, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100', 'Recognized for creative product styling.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- User Badges
INSERT INTO user_badges (id, user_id, badge_id, awarded_at, awarded_by_institution_id, created_at, updated_at)
VALUES
(1, 1, 1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 2, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Certificates
INSERT INTO certificates (id, unique_code, title, description, recipient_name, recipient_email, institution_id, issued_at, expires_at, template_data, verified, created_at, updated_at)
VALUES
(1, 'CERT-DEMO-2026-ABCD', 'Full Stack Development Certification', 'Certified proficiency in modern distributed systems and web architectures.', 'Demo User', 'demo_user@example.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 years', '{"grade":"A+","hours":120,"track":"Engineering"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sponsors
INSERT INTO sponsors (id, name, logo_url, website_url, banner_image_url, is_active, campaign_start, campaign_end, created_at, updated_at)
VALUES
(1, 'CloudScale Labs', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150', 'https://example.com/cloudscale', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600', true, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '50 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'NextGen Sportswear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150', 'https://example.com/nextgen', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600', true, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '60 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sponsor Badges
INSERT INTO sponsor_badges (id, sponsor_id, badge_id, priority, is_active, created_at, updated_at)
VALUES
(1, 1, 2, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Posts
INSERT INTO posts (id, content, user_id, parent_post_id, post_type, likes_count, comments_count, views_count, created_at, updated_at)
VALUES
(1, 'Thrilled to receive the Game City Champion badge! Big thanks to the community for supporting the journey.', 1, NULL, 'ORIGINAL', 12, 2, 120, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 'Continuing the momentum: tackling the national sports qualifications next month!', 1, 1, 'FOLLOWUP', 5, 0, 45, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Comments
INSERT INTO comments (id, content, user_id, post_id, likes_count, created_at, updated_at)
VALUES
(1, 'Congratulations! Well deserved achievement.', 2, 1, 3, CURRENT_TIMESTAMP - INTERVAL '90 minutes', CURRENT_TIMESTAMP - INTERVAL '90 minutes'),
(2, 'Way to go! Inspiring performance.', 3, 1, 1, CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence values
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('institutions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM institutions));
SELECT setval('badges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM badges));
SELECT setval('user_badges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_badges));
SELECT setval('certificates_id_seq', (SELECT COALESCE(MAX(id), 1) FROM certificates));
SELECT setval('sponsors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sponsors));
SELECT setval('sponsor_badges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sponsor_badges));
SELECT setval('posts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM posts));
SELECT setval('comments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM comments));
