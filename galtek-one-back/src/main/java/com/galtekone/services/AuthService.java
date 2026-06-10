package com.galtekone.services;

import com.galtekone.dto.login.LoginRequestDTO;
import com.galtekone.dto.login.LoginResponseDTO;

public interface AuthService {

	public LoginResponseDTO login(LoginRequestDTO req);

	public void logout(String sessionId);
	
}
