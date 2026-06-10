package com.galtekone.security;

import com.galtekone.repository.UsuariosRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UsuariosRepository repo;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var u = repo.findByUsuario(username).orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
		var roleName = "ROLE_" + u.getRol().getNombreRol().toUpperCase();
		return new User(u.getUsuario(), u.getPassword(), List.of(new SimpleGrantedAuthority(roleName)));
	}
}