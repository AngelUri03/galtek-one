package com.galtekone.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "Sesion")
@Getter
@Setter
public class SessionEntity {

	@Id
	@Column(name = "id", length = 36)
	private String id;

	@Column(name = "username")
	private String username;

	@Column(name = "created_at")
	private Instant createdAt;

	@Column(name = "last_activity")
	private Instant lastActivity;

	@Column(name = "expires_at")
	private Instant expiresAt;

	@Column(name = "revoked")
	private boolean revoked = false;

	@PrePersist
	public void pre() {
		if (id == null)
			id = UUID.randomUUID().toString();
	}
}
