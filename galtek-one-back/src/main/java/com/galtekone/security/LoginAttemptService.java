package com.galtekone.security;

import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private final ConcurrentHashMap<String, AttemptState> attempts = new ConcurrentHashMap<>();

    @Value("${app.security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.login.lock-minutes:15}")
    private long lockMinutes;

    public void assertAllowed(String username, String remoteAddress) {
        AttemptState state = attempts.get(key(username, remoteAddress));
        if (state == null || state.lockedUntil == null) {
            return;
        }

        if (Instant.now().isBefore(state.lockedUntil)) {
            throw new IllegalStateException("Demasiados intentos. Intenta de nuevo mas tarde.");
        }

        attempts.remove(key(username, remoteAddress));
    }

    public void recordSuccess(String username, String remoteAddress) {
        attempts.remove(key(username, remoteAddress));
    }

    public void recordFailure(String username, String remoteAddress) {
        String key = key(username, remoteAddress);
        attempts.compute(key, (k, current) -> {
            AttemptState state = current == null ? new AttemptState() : current;
            state.failures += 1;
            if (state.failures >= maxAttempts) {
                state.lockedUntil = Instant.now().plusSeconds(lockMinutes * 60);
            }
            return state;
        });
    }

    private static String key(String username, String remoteAddress) {
        String cleanUser = username == null ? "unknown" : username.trim().toLowerCase(Locale.ROOT);
        String cleanRemote = remoteAddress == null ? "unknown" : remoteAddress.trim();
        return cleanRemote + "|" + cleanUser;
    }

    private static class AttemptState {
        private int failures;
        private Instant lockedUntil;
    }
}
