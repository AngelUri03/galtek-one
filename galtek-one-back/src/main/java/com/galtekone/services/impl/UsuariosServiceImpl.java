package com.galtekone.services.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.crypto.RsaCryptoService;
import com.galtekone.dto.usuario.UsuariosResponseDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.RolesEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.RolesRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.UsuariosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuariosServiceImpl implements UsuariosService {

	@Autowired
	private UsuariosRepository usuariosRepository;

	@Autowired
	private RolesRepository rolesRepository;

	@Autowired
	private EmpresasRepository empresasRepo;

	@Autowired
	private RsaCryptoService rsa;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Override
	public UsuariosEntity create(UsuariosEntity obj, String user) {
		if (obj.getUsuario() == null || obj.getUsuario().isBlank())
			throw new IllegalArgumentException("El campo 'usuario' es obligatorio");
		if (obj.getPassword() == null || obj.getPassword().isBlank())
			throw new IllegalArgumentException("El campo 'password' (cifrado) es obligatorio");
		if (usuariosRepository.existsByUsuario(obj.getUsuario()))
			throw new IllegalArgumentException("El usuario ya existe");

		final String raw;
		try {
			raw = rsa.decryptBase64(obj.getPassword());
		} catch (Exception e) {
			throw new IllegalArgumentException("Password cifrado inválido", e);
		}

		String hash = passwordEncoder.encode(raw);

		UsuariosEntity u = new UsuariosEntity();
		u.setUsuario(obj.getUsuario());
		u.setPassword(hash);
		u.setNombreUsuario(obj.getNombreUsuario());
		u.setCorreo(obj.getCorreo());
		u.setTelefono(obj.getTelefono());
		u.setActivo(obj.getActivo() != null ? obj.getActivo() : 1);
		u.setUsuarioCreacion(user);

		if (obj.getRol() != null && obj.getRol().getIdRol() != null) {
			RolesEntity rol = rolesRepository.findById(obj.getRol().getIdRol())
					.orElseThrow(() -> new IllegalArgumentException("Rol inexistente"));
			u.setRol(rol);
		} else {
			throw new IllegalArgumentException("Falta 'rol.idRol'");
		}

		// Asignación automática de empresa desde el contexto
		Integer empresaId = EmpresaContextHolder.getEmpresaId();
		EmpresasEntity empresa = new EmpresasEntity();
		empresa.setIdEmpresa(empresaId);
		u.setEmpresa(empresa);

		if (obj.getAvatarUrl() != null && !obj.getAvatarUrl().isBlank()) {
			u.setAvatarUrl(obj.getAvatarUrl());
		}

		UsuariosEntity resp = usuariosRepository.save(u);
		resp.setPassword("");

		return resp;
	}

	@Override
	public List<UsuariosEntity> read(Specification<UsuariosEntity> specs) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Specification<UsuariosEntity> filtroEmpresa = (root, query, cb) -> cb
				.equal(root.get("empresa").get("idEmpresa"), empresaId);

		Specification<UsuariosEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

		List<UsuariosEntity> resp = usuariosRepository.findAll(finalSpec);
		resp.forEach(u -> u.setPassword("")); // Limpieza de password
		return resp;
	}

	@Override
	public List<UsuariosResponseDTO.RolUsuarios> getUsuariosRol(Integer idEmpresa) {
		if (idEmpresa == null) {
			throw new IllegalArgumentException("Header requerido faltante: idEmpresa");
		}

		List<RolesEntity> roles = rolesRepository.findByEmpresa_IdEmpresaOrderByNombreRolAsc(idEmpresa);
		List<UsuariosEntity> usuarios = usuariosRepository.findByEmpresa_IdEmpresa(idEmpresa);
		Map<String, List<UsuariosResponseDTO.UsuarioItem>> usuariosPorRol = usuarios.stream()
				.collect(
						Collectors
								.groupingBy(u -> u.getRol().getNombreRol(),
										Collectors
												.mapping(
														u -> new UsuariosResponseDTO.UsuarioItem(u.getNombreUsuario(),
																u.getUsuario(), u.getAvatarUrl()),
														Collectors.toList())));

		List<UsuariosResponseDTO.RolUsuarios> response = new ArrayList<>();
		for (RolesEntity rol : roles) {
			response.add(new UsuariosResponseDTO.RolUsuarios(rol.getNombreRol(),
					usuariosPorRol.getOrDefault(rol.getNombreRol(), Collections.emptyList())));
		}

		return response;
	}

	@Override
	public UsuariosEntity update(UsuariosEntity obj, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<UsuariosEntity> aux = usuariosRepository.findById(obj.getIdUsuario());

		if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Usuario no encontrado o no pertenece a tu empresa");
		}

		UsuariosEntity entityToUpdate = aux.get();

		if (obj.getNombreUsuario() != null) {
			entityToUpdate.setNombreUsuario(obj.getNombreUsuario());
		}

		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		if (obj.getActivo() != null) {
			entityToUpdate.setActivo(obj.getActivo());
		}

		if (obj.getPassword() != null) {
			entityToUpdate.setPassword(obj.getPassword());
		}

		if (obj.getCorreo() != null) {
			entityToUpdate.setCorreo(obj.getCorreo());
		}

		if (obj.getRol() != null) {
			entityToUpdate.setRol(obj.getRol());
		}

		if (obj.getUsuario() != null) {
			entityToUpdate.setUsuario(obj.getUsuario());
		}

		if (obj.getTelefono() != null) {
			entityToUpdate.setTelefono(obj.getTelefono());
		}

		if (obj.getAvatarUrl() != null) {
			entityToUpdate.setAvatarUrl(obj.getAvatarUrl());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return usuariosRepository.save(entityToUpdate);
	}

	@Override
	public UsuariosEntity delete(Integer idUsuario, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<UsuariosEntity> optional = usuariosRepository.findById(idUsuario);

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Usuario no encontrado o no pertenece a tu empresa");
		}

		UsuariosEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		usuariosRepository.deleteById(idUsuario);

		return entity;
	}
}
