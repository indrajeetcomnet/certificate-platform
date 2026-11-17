package com.certificate.platform.util;

import java.security.SecureRandom;
import java.time.Year;

public class UniqueCodeGenerator {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String DEFAULT_PREFIX = "CERT";
    private static final int GROUP_SIZE = 4;
    private static final int GROUP_COUNT = 3;

    /**
     * Generates a certificate code in format CERT-XXXX-XXXX-XXXX
     * where X is an alphanumeric character.
     */
    public static String generate() {
        return generate(DEFAULT_PREFIX);
    }

    /**
     * Generates a certificate code with custom prefix: [PREFIX]-XXXX-XXXX-XXXX
     */
    public static String generate(String prefix) {
        String cleanPrefix = cleanPrefix(prefix);
        StringBuilder code = new StringBuilder(cleanPrefix);
        for (int g = 0; g < GROUP_COUNT; g++) {
            code.append('-');
            for (int i = 0; i < GROUP_SIZE; i++) {
                code.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
        }
        return code.toString();
    }

    /**
     * Generates formatted code according to custom user-chosen style:
     * - STANDARD: PREFIX-XXXX-XXXX-XXXX (e.g. CERT-8492-9912-3841)
     * - BRANDED: PREFIX-YYYY-XXXX (e.g. APEX-2026-9A4B)
     * - SERIAL: PREFIX-SERIES-XXXXXX (e.g. GC-SERIES-394821)
     */
    public static String generateFormatted(String prefix, String style) {
        String cleanPrefix = cleanPrefix(prefix);
        int year = Year.now().getValue();
        if ("BRANDED".equalsIgnoreCase(style) || "ACADEMY".equalsIgnoreCase(style)) {
            StringBuilder sb = new StringBuilder(cleanPrefix).append('-').append(year).append('-');
            for (int i = 0; i < 4; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            return sb.toString();
        } else if ("SERIAL".equalsIgnoreCase(style)) {
            StringBuilder sb = new StringBuilder(cleanPrefix).append("-SERIES-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            return sb.toString();
        }
        return generate(cleanPrefix);
    }

    private static String cleanPrefix(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return DEFAULT_PREFIX;
        }
        String cleaned = prefix.trim().toUpperCase().replaceAll("[^A-Z0-9_-]", "");
        return cleaned.isEmpty() ? DEFAULT_PREFIX : cleaned;
    }
}
