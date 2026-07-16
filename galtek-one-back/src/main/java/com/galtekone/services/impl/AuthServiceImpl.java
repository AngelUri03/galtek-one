package com.galtekone.services.impl;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.galtekone.crypto.RsaCryptoService;
import com.galtekone.dto.login.LoginRequestDTO;
import com.galtekone.dto.login.LoginResponseDTO;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.security.JwtService;
import com.galtekone.services.AuthService;
import com.galtekone.services.SessionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	@Autowired
	private UsuariosRepository usuariosRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtService jwtService;

	@Autowired
	private SessionService sessionService;

	@Autowired
	private RsaCryptoService rsaCryptoService;

	@Override
	public LoginResponseDTO login(LoginRequestDTO req) {
		UsuariosEntity user = usuariosRepository.findByUsuario(req.getUsuario())
				.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

		if (!isActiveUser(user)) {
			throw new BadCredentialsException("Usuario inactivo");
		}

		final String raw;
		try {
			raw = rsaCryptoService.decryptBase64(req.getPassword());
		} catch (Exception e) {
			throw new BadCredentialsException("Password cifrado inválido", e);
		}

		if (!passwordEncoder.matches(raw, user.getPassword())) {
			throw new BadCredentialsException("Credenciales inválidas");
		}

		var session = sessionService.create(user.getUsuario());

		Map<String, Object> claims = new HashMap<>();
		if (user.getRol() != null)
			claims.put("rol", user.getRol().getNombreRol());
		if (user.getEmpresa() != null)
			claims.put("idEmpresa", user.getEmpresa().getIdEmpresa());
		

		String token = jwtService.generateAccess(user.getUsuario(), session.getId(), claims);

		String rol = user.getRol() != null ? user.getRol().getNombreRol() : null;
		return new LoginResponseDTO(
			    token,
			    user.getUsuario(),
			    user.getNombreUsuario(),
			    rol,
			    user.getAvatarUrl(),
			    user.getEmpresa().getIdEmpresa(),
			    user.getEmpresa().getNombreEmpresa(),
			    user.getIdUsuario(),
			    Boolean.TRUE.equals(user.getRequiereCambioPassword())
			);
	}

	private boolean isActiveUser(UsuariosEntity user) {
		return user != null
				&& user.getActivo() != null
				&& user.getActivo().intValue() != 0
				&& !Boolean.FALSE.equals(user.getEstatus());
	}

	@Override
	public void logout(String authHeader) {
		if (authHeader == null || !authHeader.startsWith("Bearer "))
			return;
		String token = authHeader.substring("Bearer ".length()).trim();
		try {
			var jws = jwtService.parse(token);
			String sid = jws.getBody().get("sid", String.class);
			if (sid != null)
				sessionService.revoke(sid);
		} catch (Exception ignored) {
		}
	}

}
