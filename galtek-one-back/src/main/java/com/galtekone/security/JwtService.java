package com.galtekone.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

	private final Key key;
	private final long accessExpMs;
	private static final String DEFAULT_DESKTOP_SECRET = "GaltekOneLocalDevelopmentSecretChangeMe";

	public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.access-exp-ms}") long accessExpMs) {
		this.key = Keys.hmacShaKeyFor(resolveSecret(secret).getBytes(StandardCharsets.UTF_8));
		this.accessExpMs = accessExpMs;
	}

	public String generateAccess(String username, String sessionId, Map<String, ?> claims) {
		Date now = new Date();
		JwtBuilder b = Jwts.builder().setSubject(username).claim("sid", sessionId).setIssuedAt(now)
				.setExpiration(new Date(now.getTime() + accessExpMs)).signWith(key, SignatureAlgorithm.HS256);
		if (claims != null)
			claims.forEach(b::claim);
		return b.compact();
	}

	public Jws<Claims> parse(String token) {
		return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
	}

	private String resolveSecret(String configuredSecret) {
		if (configuredSecret != null && configuredSecret.length() >= 32
				&& !DEFAULT_DESKTOP_SECRET.equals(configuredSecret)) {
			return configuredSecret;
		}

		try {
			Path dir = Path.of(System.getProperty("user.home"), "AppData", "Roaming", "GaltekOne");
			Path secretFile = dir.resolve("jwt-secret.key");
			Files.createDirectories(dir);

			if (Files.exists(secretFile)) {
				String stored = Files.readString(secretFile, StandardCharsets.UTF_8).trim();
				if (stored.length() >= 32) {
					return stored;
				}
			}

			byte[] bytes = new byte[64];
			new SecureRandom().nextBytes(bytes);
			String generated = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
			Files.writeString(secretFile, generated, StandardCharsets.UTF_8);
			return generated;
		} catch (IOException ex) {
			byte[] bytes = new byte[64];
			new SecureRandom().nextBytes(bytes);
			return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		}
	}
	
}
