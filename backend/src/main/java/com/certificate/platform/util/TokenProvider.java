package com.certificate.platform.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Enterprise Cryptographic Token Provider with HMAC-SHA256 Signatures and Entropy Nonce.
 * Guarantees cryptographic integrity, tampering detection, and anti-forgery protection.
 */
public final class TokenProvider {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long EXPIRATION_SECONDS = 86400 * 7; // 7 days
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    // Stable 256-bit cryptographic key
    private static final byte[] HMAC_SECRET_BYTES;

    static {
        String envSecret = System.getenv("AUTH_HMAC_SECRET");
        if (envSecret != null && envSecret.trim().length() >= 32) {
            HMAC_SECRET_BYTES = envSecret.trim().getBytes(StandardCharsets.UTF_8);
        } else {
            HMAC_SECRET_BYTES = "CertPlatform_Enterprise_Secret_Key_2026_HMAC_SHA256".getBytes(StandardCharsets.UTF_8);
        }
    }

    private TokenProvider() {}

    /**
     * Generates an authentic cryptographically signed token with random entropy salt.
     * Structure: userId:username:role:expiresAt:signatureField
     * Entire payload is base64url encoded.
     */
    public static String generateToken(Long userId, String username, String role) {
        long expiresAt = Instant.now().getEpochSecond() + EXPIRATION_SECONDS;
        byte[] saltBytes = new byte[12];
        RANDOM.nextBytes(saltBytes);
        String salt = Base64.getUrlEncoder().withoutPadding().encodeToString(saltBytes);

        String claims = userId + ":" + username + ":" + role + ":" + expiresAt;
        String hmac = sign(claims + ":" + salt);
        String signatureField = hmac + "-" + salt;

        String payload = claims + ":" + signatureField;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    public static Long getExpirationSeconds() {
        return EXPIRATION_SECONDS;
    }

    public static String[] decodeClaims(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        try {
            byte[] bytes = Base64.getUrlDecoder().decode(token.trim());
            String payload = new String(bytes, StandardCharsets.UTF_8);
            String[] parts = payload.split(":");
            if (parts.length >= 5) {
                return parts;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Verifies that the token signature matches HMAC-SHA256 and has not expired or been tampered with.
     */
    public static boolean isValid(String token) {
        String[] claims = decodeClaims(token);
        if (claims == null || claims.length < 5) return false;

        try {
            long expiresAt = Long.parseLong(claims[3]);
            if (expiresAt <= Instant.now().getEpochSecond()) {
                return false;
            }

            String sigField = claims[4];
            int dashIndex = sigField.lastIndexOf('-');
            if (dashIndex != -1) {
                String hmac = sigField.substring(0, dashIndex);
                String salt = sigField.substring(dashIndex + 1);
                String claimsData = claims[0] + ":" + claims[1] + ":" + claims[2] + ":" + claims[3] + ":" + salt;
                String expectedHmac = sign(claimsData);
                return constantTimeEquals(hmac, expectedHmac);
            } else {
                String claimsData = claims[0] + ":" + claims[1] + ":" + claims[2] + ":" + claims[3];
                String expectedHmac = sign(claimsData);
                return constantTimeEquals(sigField, expectedHmac);
            }
        } catch (Exception e) {
            return false;
        }
    }

    public static Long getUserId(String token) {
        String[] claims = decodeClaims(token);
        if (claims == null) return null;
        try {
            return Long.parseLong(claims[0]);
        } catch (Exception e) {
            return null;
        }
    }

    public static String getUsername(String token) {
        String[] claims = decodeClaims(token);
        return claims != null ? claims[1] : null;
    }

    public static String getRole(String token) {
        String[] claims = decodeClaims(token);
        return claims != null ? claims[2] : null;
    }

    public static boolean isExpired(String token) {
        String[] claims = decodeClaims(token);
        if (claims == null) return true;
        try {
            long expiresAt = Long.parseLong(claims[3]);
            return expiresAt <= Instant.now().getEpochSecond();
        } catch (Exception e) {
            return true;
        }
    }

    private static String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(HMAC_SECRET_BYTES, HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC signature", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
