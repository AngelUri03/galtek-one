package com.galtekone.services;

import com.galtekone.entity.SessionEntity;

public interface SessionService {

	SessionEntity create(String username);

	SessionEntity validateAndTouch(String sessionId); 

	void revoke(String sessionId);

	void revokeAll();

}
