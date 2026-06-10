package com.galtekone.services.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.galtekone.entity.SessionEntity;
import com.galtekone.repository.SessionRepository;
import com.galtekone.services.SessionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

	private final SessionRepository repo;

	@Value("${app.session.idle-max-seconds}")
	private long idleMaxSeconds;
	@Value("${app.session.absolute-max-ms}")
	private long absoluteMaxMs;
	@Value("${app.session.touch-min-seconds:60}")
	private long touchMinSeconds;

	@Override
	public SessionEntity create(String username) {
		var now = java.time.Instant.now();
		var s = new SessionEntity();
		s.setUsername(username);
		s.setCreatedAt(now);
		s.setLastActivity(now);
		s.setExpiresAt(now.plusMillis(absoluteMaxMs));
		return repo.save(s);
	}

	@Override
	public synchronized SessionEntity validateAndTouch(String sessionId) {
		var s = repo.findById(sessionId).orElseThrow(() -> new IllegalStateException("Sesión inexistente"));
		var now = java.time.Instant.now();
		if (s.isRevoked())
			throw new IllegalStateException("Sesión revocada");
		if (now.isAfter(s.getExpiresAt()))
			throw new IllegalStateException("Sesión expirada");
		if (now.isAfter(s.getLastActivity().plusSeconds(idleMaxSeconds)))
			throw new IllegalStateException("Sesión expirada por inactividad");
		if (s.getLastActivity() != null
				&& now.isBefore(s.getLastActivity().plusSeconds(touchMinSeconds))) {
			return s;
		}

		s.setLastActivity(now);
		return repo.save(s);
	}

	@Override
	public void revoke(String sessionId) {
		repo.findById(sessionId).ifPresent(s -> {
			s.setRevoked(true);
			repo.save(s);
		});
	}

	@Override
	public synchronized void revokeAll() {
		var sessions = repo.findAll();
		for (var session : sessions) {
			if (!session.isRevoked()) {
				session.setRevoked(true);
			}
		}
		repo.saveAll(sessions);
	}
	
}
