package com.galtekone.services.impl;

import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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
import com.galtekone.repository.RolesRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.UsuariosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuariosServiceImpl implements UsuariosService {

	private static final long MAX_AVATAR_BYTES = 2_500_000L;

	@Autowired
	private UsuariosRepository usuariosRepository;

	@Autowired
	private RolesRepository rolesRepository;

	@Autowired
	private RsaCryptoService rsa;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Override
	public UsuariosEntity create(UsuariosEntity obj, String user) {
		Integer empresaId = requireEmpresaId();
		String usuarioNormalizado = normalizeLogin(obj.getUsuario());
		String nombreNormalizado = normalizeNombre(obj.getNombreUsuario());
		String correoNormalizado = normalizeOptional(obj.getCorreo());
		String telefonoNormalizado = normalizeOptional(obj.getTelefono());

		if (obj.getPassword() == null || obj.getPassword().isBlank()) {
			throw new IllegalArgumentException("El campo 'password' cifrado es obligatorio");
		}
		if (usuariosRepository.existsByUsuario(usuarioNormalizado)) {
			throw new IllegalArgumentException("El usuario ya existe");
		}

		UsuariosEntity u = new UsuariosEntity();
		u.setUsuario(usuarioNormalizado);
		u.setPassword(decodeAndHashPassword(obj.getPassword()));
		u.setNombreUsuario(nombreNormalizado);
		u.setCorreo(correoNormalizado);
		u.setTelefono(telefonoNormalizado);
		u.setActivo(obj.getActivo() != null ? obj.getActivo() : 1);
		u.setEstatus(obj.getEstatus() != null ? obj.getEstatus() : true);
		u.setRequiereCambioPassword(Boolean.TRUE);
		u.setUsuarioCreacion(user);

		if (obj.getRol() == null || obj.getRol().getIdRol() == null) {
			throw new IllegalArgumentException("Falta 'rol.idRol'");
		}

		RolesEntity rol = rolesRepository.findByIdRolAndEmpresa_IdEmpresa(obj.getRol().getIdRol(), empresaId)
				.orElseThrow(() -> new IllegalArgumentException("Rol inexistente"));
		u.setRol(rol);

		EmpresasEntity empresa = new EmpresasEntity();
		empresa.setIdEmpresa(empresaId);
		u.setEmpresa(empresa);

		if (obj.getAvatarUrl() != null && !obj.getAvatarUrl().isBlank()) {
			u.setAvatarUrl(obj.getAvatarUrl());
		}

		return clearPassword(usuariosRepository.save(u));
	}

	@Override
	public List<UsuariosEntity> read(Specification<UsuariosEntity> specs) {
		Integer empresaId = requireEmpresaId();

		Specification<UsuariosEntity> filtroEmpresa = (root, query, cb) -> cb
				.equal(root.get("empresa").get("idEmpresa"), empresaId);
		Specification<UsuariosEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

		List<UsuariosEntity> resp = usuariosRepository.findAll(finalSpec);
		resp.forEach(this::clearPassword);
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
				.collect(Collectors.groupingBy(u -> u.getRol().getNombreRol(),
						Collectors.mapping(
								u -> new UsuariosResponseDTO.UsuarioItem(u.getNombreUsuario(), u.getUsuario(),
										u.getAvatarUrl()),
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
		Integer empresaId = requireEmpresaId();
		UsuariosEntity entityToUpdate = getUsuarioInEmpresa(obj.getIdUsuario(), empresaId);

		if (obj.getNombreUsuario() != null) {
			entityToUpdate.setNombreUsuario(normalizeNombre(obj.getNombreUsuario()));
		}

		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		if (obj.getActivo() != null) {
			validateStatusChange(entityToUpdate, obj.getActivo(), user, empresaId);
			entityToUpdate.setActivo(obj.getActivo());
		}

		if (obj.getPassword() != null && !obj.getPassword().isBlank()) {
			entityToUpdate.setPassword(decodeAndHashPassword(obj.getPassword()));
			entityToUpdate.setRequiereCambioPassword(Boolean.FALSE);
		}

		if (obj.getCorreo() != null) {
			entityToUpdate.setCorreo(normalizeOptional(obj.getCorreo()));
		}

		if (obj.getRol() != null) {
			if (obj.getRol().getIdRol() == null) {
				throw new IllegalArgumentException("Falta 'rol.idRol'");
			}
			RolesEntity rol = rolesRepository.findByIdRolAndEmpresa_IdEmpresa(obj.getRol().getIdRol(), empresaId)
					.orElseThrow(() -> new IllegalArgumentException("Rol inexistente"));
			entityToUpdate.setRol(rol);
		}

		if (obj.getUsuario() != null) {
			String nextUsuario = normalizeLogin(obj.getUsuario());
			if (!nextUsuario.equalsIgnoreCase(entityToUpdate.getUsuario())
					&& usuariosRepository.existsByUsuario(nextUsuario)) {
				throw new IllegalArgumentException("El usuario ya existe");
			}
			entityToUpdate.setUsuario(nextUsuario);
		}

		if (obj.getTelefono() != null) {
			entityToUpdate.setTelefono(normalizeOptional(obj.getTelefono()));
		}

		if (obj.getAvatarUrl() != null) {
			entityToUpdate.setAvatarUrl(obj.getAvatarUrl());
		}

		entityToUpdate.setUsuarioModificacion(user);
		return clearPassword(usuariosRepository.save(entityToUpdate));
	}

	@Override
	public UsuariosEntity delete(Integer idUsuario, String user) {
		return desactivar(idUsuario, user);
	}

	@Override
	public UsuariosEntity updatePassword(Integer idUsuario, String encryptedPassword, String user) {
		if (encryptedPassword == null || encryptedPassword.isBlank()) {
			throw new IllegalArgumentException("El campo 'password' cifrado es obligatorio");
		}

		Integer empresaId = requireEmpresaId();
		UsuariosEntity requester = usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
				.orElseThrow(() -> new EntityNotFoundException("Usuario solicitante no encontrado"));
		if (!isAdmin(requester)) {
			throw new IllegalArgumentException("Solo un administrador puede restablecer passwords");
		}

		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, empresaId);
		usuario.setPassword(decodeAndHashPassword(encryptedPassword));
		usuario.setRequiereCambioPassword(Boolean.TRUE);
		usuario.setUsuarioModificacion(user);

		return clearPassword(usuariosRepository.save(usuario));
	}

	@Override
	public UsuariosEntity changeOwnPassword(String user, String encryptedPassword) {
		if (encryptedPassword == null || encryptedPassword.isBlank()) {
			throw new IllegalArgumentException("El campo 'password' cifrado es obligatorio");
		}

		Integer empresaId = requireEmpresaId();
		UsuariosEntity usuario = usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado o no pertenece a tu empresa"));
		usuario.setPassword(decodeAndHashPassword(encryptedPassword));
		usuario.setRequiereCambioPassword(Boolean.FALSE);
		usuario.setUsuarioModificacion(user);

		return clearPassword(usuariosRepository.save(usuario));
	}

	@Override
	public UsuariosEntity updateAvatar(Integer idUsuario, String contentType, byte[] bytes, String user) {
		Integer empresaId = requireEmpresaId();
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, empresaId);
		String mime = normalizeImageContentType(contentType);

		if (bytes == null || bytes.length == 0) {
			throw new IllegalArgumentException("La imagen es obligatoria");
		}
		if (bytes.length > MAX_AVATAR_BYTES) {
			throw new IllegalArgumentException("La imagen no debe superar 2.5 MB");
		}

		usuario.setAvatarUrl("data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes));
		usuario.setUsuarioModificacion(user);

		return clearPassword(usuariosRepository.save(usuario));
	}

	@Override
	public UsuariosEntity activar(Integer idUsuario, String user) {
		Integer empresaId = requireEmpresaId();
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, empresaId);
		usuario.setActivo(1);
		usuario.setEstatus(true);
		usuario.setUsuarioModificacion(user);
		return clearPassword(usuariosRepository.save(usuario));
	}

	@Override
	public UsuariosEntity desactivar(Integer idUsuario, String user) {
		Integer empresaId = requireEmpresaId();
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, empresaId);
		validateStatusChange(usuario, 0, user, empresaId);
		usuario.setActivo(0);
		usuario.setEstatus(false);
		usuario.setUsuarioModificacion(user);
		return clearPassword(usuariosRepository.save(usuario));
	}

	private Integer requireEmpresaId() {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();
		if (empresaId == null) {
			throw new IllegalArgumentException("Empresa activa no disponible");
		}
		return empresaId;
	}

	private UsuariosEntity getUsuarioInEmpresa(Integer idUsuario, Integer empresaId) {
		if (idUsuario == null) {
			throw new IllegalArgumentException("idUsuario es requerido");
		}
		return usuariosRepository.findByIdUsuarioAndEmpresa_IdEmpresa(idUsuario, empresaId)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado o no pertenece a tu empresa"));
	}

	private String decodeAndHashPassword(String encryptedPassword) {
		final String raw;
		try {
			raw = rsa.decryptBase64(encryptedPassword);
		} catch (Exception e) {
			throw new IllegalArgumentException("Password cifrado invalido", e);
		}

		if (raw == null || raw.length() < 6) {
			throw new IllegalArgumentException("La password debe tener al menos 6 caracteres");
		}

		return passwordEncoder.encode(raw);
	}

	private String normalizeLogin(String value) {
		String login = normalizeRequired(value, "El campo 'usuario' es obligatorio").replaceAll("\\s+", "");
		if (login.length() < 3) {
			throw new IllegalArgumentException("El usuario debe tener al menos 3 caracteres");
		}
		return login;
	}

	private String normalizeNombre(String value) {
		String nombre = normalizeRequired(value, "El campo 'nombreUsuario' es obligatorio").replaceAll("\\s+", " ");
		if (nombre.length() < 3) {
			throw new IllegalArgumentException("El nombre debe tener al menos 3 caracteres");
		}
		return nombre;
	}

	private String normalizeRequired(String value, String message) {
		if (value == null) {
			throw new IllegalArgumentException(message);
		}
		String normalized = value.trim();
		if (normalized.isBlank()) {
			throw new IllegalArgumentException(message);
		}
		return normalized;
	}

	private String normalizeOptional(String value) {
		return value == null ? "" : value.trim();
	}

	private String normalizeImageContentType(String contentType) {
		String mime = contentType == null ? "" : contentType.toLowerCase();
		if ("image/jpeg".equals(mime) || "image/png".equals(mime) || "image/webp".equals(mime)) {
			return mime;
		}
		throw new IllegalArgumentException("Formato de imagen no permitido");
	}

	private void validateStatusChange(UsuariosEntity usuario, Integer nextActivo, String user, Integer empresaId) {
		if (nextActivo == null || nextActivo.intValue() != 0) {
			return;
		}
		validateSelfAction(usuario, user, "No puedes desactivar tu propio usuario");
		validateLastAdmin(usuario, empresaId, "No puedes desactivar el ultimo administrador activo");
	}

	private void validateSelfAction(UsuariosEntity usuario, String user, String message) {
		if (usuario.getUsuario() != null && user != null && usuario.getUsuario().equalsIgnoreCase(user.trim())) {
			throw new IllegalArgumentException(message);
		}
	}

	private void validateLastAdmin(UsuariosEntity usuario, Integer empresaId, String message) {
		if (!isAdmin(usuario)) {
			return;
		}

		long activeAdmins = usuariosRepository.findByEmpresa_IdEmpresa(empresaId).stream()
				.filter(this::isActiveUser)
				.filter(this::isAdmin)
				.count();

		if (activeAdmins <= 1) {
			throw new IllegalArgumentException(message);
		}
	}

	private boolean isActiveUser(UsuariosEntity usuario) {
		return usuario != null
				&& usuario.getActivo() != null
				&& usuario.getActivo().intValue() != 0
				&& !Boolean.FALSE.equals(usuario.getEstatus());
	}

	private boolean isAdmin(UsuariosEntity usuario) {
		String rol = usuario != null && usuario.getRol() != null ? usuario.getRol().getNombreRol() : "";
		return rol != null && rol.toLowerCase().contains("admin");
	}

	private UsuariosEntity clearPassword(UsuariosEntity usuario) {
		if (usuario != null) {
			usuario.setPassword("");
		}
		return usuario;
	}
}
