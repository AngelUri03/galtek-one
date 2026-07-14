package com.galtekone.services.impl;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.dto.usuario.UsuarioOverridesRequestDTO;
import com.galtekone.dto.usuario.UsuarioPermisosEfectivosDTO;
import com.galtekone.dto.usuario.UsuariosOverridesResumenDTO;
import com.galtekone.entity.PermisosEntity;
import com.galtekone.entity.RolesPermisosEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.entity.UsuariosPermisosEntity;
import com.galtekone.repository.PermisosRepository;
import com.galtekone.repository.RolesPermisosRepository;
import com.galtekone.repository.UsuariosPermisosRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.UsuariosPermisosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuariosPermisosServiceImpl implements UsuariosPermisosService {

	private static final Set<String> PROTECTED_ROLE_NAMES = Set.of("ADMINISTRADOR", "ADMIN");
	private static final Set<String> NON_OVERRIDEABLE_KEYS = Set.of(
			"CONFIG_ROLES_GESTIONAR",
			"CONFIG_ROLES_PERMISOS",
			"CONFIG_OVERRIDES_GESTIONAR",
			"CONFIG_RESTAURAR_RESPALDO",
			"CONFIG_USUARIOS",
			"CONFIG_USUARIOS_GESTIONAR",
			"CONFIG_USUARIOS_PASSWORD",
			"CONFIG_AUDITORIA_VER");

	@Autowired
	private UsuariosPermisosRepository usuariosPermisosRepository;

	@Autowired
	private UsuariosRepository usuariosRepository;

	@Autowired
	private PermisosRepository permisosRepository;

	@Autowired
	private RolesPermisosRepository rolesPermisosRepository;

	@Override
	public UsuariosPermisosEntity create(UsuariosPermisosEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return usuariosPermisosRepository.save(obj);
	}

	@Override
	public List<UsuariosPermisosEntity> read(Specification<UsuariosPermisosEntity> specs) {
		return usuariosPermisosRepository.findAll(Specification.where(specs));
	}

	@Override
	public UsuariosPermisosEntity update(UsuariosPermisosEntity obj, String user) {
		Optional<UsuariosPermisosEntity> aux = usuariosPermisosRepository.findById(obj.getIdUsuariosPermisos());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException(
					"Registro UsuariosPermisos no encontrado con ID: " + obj.getIdUsuariosPermisos());
		}

		UsuariosPermisosEntity entityToUpdate = aux.get();

		if (obj.getUsuario() != null) {
			entityToUpdate.setUsuario(obj.getUsuario());
		}
		if (obj.getPermiso() != null) {
			entityToUpdate.setPermiso(obj.getPermiso());
		}
		if (obj.getEfecto() != null) {
			entityToUpdate.setEfecto(obj.getEfecto());
		}
		if (obj.getMotivo() != null) {
			entityToUpdate.setMotivo(obj.getMotivo());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return usuariosPermisosRepository.save(entityToUpdate);
	}

	@Override
	public UsuariosPermisosEntity delete(Integer idUsuariosPermisos, String user) {
		Optional<UsuariosPermisosEntity> optional = usuariosPermisosRepository.findById(idUsuariosPermisos);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Registro UsuariosPermisos no encontrado con ID: " + idUsuariosPermisos);
		}

		UsuariosPermisosEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		usuariosPermisosRepository.deleteById(idUsuariosPermisos);

		return entity;
	}

	@Override
	@Transactional(readOnly = true)
	public UsuariosOverridesResumenDTO getOverridesResumen(Integer idEmpresa, String user) {
		validateRequesterCanManageOverrides(user, idEmpresa);

		List<UsuariosEntity> usuarios = usuariosRepository.findByEmpresa_IdEmpresa(idEmpresa);
		List<UsuariosPermisosEntity> overrides = usuariosPermisosRepository.findActiveByEmpresa(idEmpresa);
		Map<Integer, List<UsuariosPermisosEntity>> overridesByUser = overrides.stream()
				.collect(Collectors.groupingBy(up -> up.getUsuario().getIdUsuario()));
		Map<Integer, Integer> inheritedCountByRole = new HashMap<>();

		UsuariosOverridesResumenDTO response = new UsuariosOverridesResumenDTO();
		UsuariosOverridesResumenDTO.Resumen resumen = response.getResumen();

		usuarios.stream()
				.sorted(Comparator.comparing(UsuariosEntity::getNombreUsuario,
						Comparator.nullsLast(String::compareToIgnoreCase)))
				.forEach(usuario -> {
					List<UsuariosPermisosEntity> userOverrides = overridesByUser.getOrDefault(usuario.getIdUsuario(),
							List.of());
					Integer idRol = usuario.getRol() != null ? usuario.getRol().getIdRol() : null;
					int inherited = idRol == null ? 0 : inheritedCountByRole.computeIfAbsent(idRol,
							this::countInheritedPermissions);
					long permitidos = userOverrides.stream()
							.filter(up -> "PERMITIR".equals(normalizeEffectLoose(up.getEfecto()))).count();
					long denegados = userOverrides.stream()
							.filter(up -> "DENEGAR".equals(normalizeEffectLoose(up.getEfecto()))).count();
					long criticos = userOverrides.stream().filter(up -> isCriticalRisk(up.getPermiso())).count();

					UsuariosOverridesResumenDTO.UsuarioOverrideItem item = new UsuariosOverridesResumenDTO.UsuarioOverrideItem();
					item.setIdUsuario(usuario.getIdUsuario());
					item.setNombreUsuario(usuario.getNombreUsuario());
					item.setUsuario(usuario.getUsuario());
					item.setCorreo(usuario.getCorreo());
					item.setTelefono(usuario.getTelefono());
					item.setAvatarUrl(usuario.getAvatarUrl());
					item.setActivo(isActiveUser(usuario));
					item.setIdRol(idRol);
					item.setNombreRol(usuario.getRol() != null ? usuario.getRol().getNombreRol() : "");
					item.setRolProtegido(isProtectedRole(usuario));
					item.setPermisosHeredados(inherited);
					item.setOverridesActivos(userOverrides.size());
					item.setOverridesPermitidos((int) permitidos);
					item.setOverridesDenegados((int) denegados);
					item.setOverridesCriticos((int) criticos);
					item.setPermisosOverride(userOverrides.stream()
							.map(up -> String.join(" ",
									safe(up.getPermiso().getNombre()),
									safe(up.getPermiso().getClave()),
									safe(up.getPermiso().getModulo())))
							.filter(value -> !value.isBlank())
							.toList());
					response.getUsuarios().add(item);

					if (isActiveUser(usuario)) resumen.setUsuariosActivos(resumen.getUsuariosActivos() + 1);
					if (!userOverrides.isEmpty()) resumen.setUsuariosConOverrides(resumen.getUsuariosConOverrides() + 1);
					resumen.setOverridesActivos(resumen.getOverridesActivos() + userOverrides.size());
					resumen.setPermitidosPorExcepcion(resumen.getPermitidosPorExcepcion() + (int) permitidos);
					resumen.setDenegadosPorExcepcion(resumen.getDenegadosPorExcepcion() + (int) denegados);
					resumen.setOverridesCriticos(resumen.getOverridesCriticos() + (int) criticos);
				});

		return response;
	}

	@Override
	@Transactional(readOnly = true)
	public UsuarioPermisosEfectivosDTO getPermisosEfectivos(Integer idUsuario, Integer idEmpresa, String user) {
		validateRequesterCanManageOverrides(user, idEmpresa);
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, idEmpresa);
		return buildEffectivePermissions(usuario, idEmpresa);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioPermisosEfectivosDTO.OverrideActivo> getOverridesActivos(Integer idUsuario, Integer idEmpresa,
			String user) {
		validateRequesterCanManageOverrides(user, idEmpresa);
		getUsuarioInEmpresa(idUsuario, idEmpresa);
		return usuariosPermisosRepository.findActiveByUsuarioAndEmpresa(idUsuario, idEmpresa).stream()
				.sorted(Comparator.comparing((UsuariosPermisosEntity up) -> safe(up.getPermiso().getModulo()))
						.thenComparing(up -> safe(up.getPermiso().getNombre())))
				.map(this::toOverrideActivo)
				.toList();
	}

	@Override
	@Transactional
	public UsuarioPermisosEfectivosDTO updateOverrides(Integer idUsuario, Integer idEmpresa,
			UsuarioOverridesRequestDTO body, String user) {
		validateRequesterCanManageOverrides(user, idEmpresa);
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, idEmpresa);
		validateTargetEditable(usuario, user);

		List<UsuarioOverridesRequestDTO.OverrideItem> requested = body != null && body.getOverrides() != null
				? body.getOverrides()
				: List.of();
		if (requested.isEmpty()) {
			return buildEffectivePermissions(usuario, idEmpresa);
		}

		Map<Integer, PermisosEntity> permisos = permisosRepository.findByEstatusTrueOrderByModuloAscNombreAsc()
				.stream()
				.collect(Collectors.toMap(PermisosEntity::getIdPermiso, Function.identity()));
		Set<Integer> rolePermissionIds = inheritedPermissionIds(usuario);

		for (UsuarioOverridesRequestDTO.OverrideItem item : requested) {
			if (item == null || item.getIdPermiso() == null) {
				throw new IllegalArgumentException("Cada override debe incluir idPermiso");
			}
			PermisosEntity permiso = permisos.get(item.getIdPermiso());
			if (permiso == null) {
				throw new EntityNotFoundException("Permiso no encontrado o inactivo: " + item.getIdPermiso());
			}

			String efecto = normalizeEffect(item.getEfecto());
			if ("HEREDADO".equals(efecto)) {
				deactivateOverrides(usuario.getIdUsuario(), permiso.getIdPermiso(), idEmpresa, user);
				continue;
			}

			if (isNoOverrideable(permiso)) {
				throw new IllegalArgumentException("Este permiso es critico y solo puede administrarse desde Roles.");
			}

			String motivo = normalizeMotivo(item.getMotivo());
			boolean permitidoPorRol = rolePermissionIds.contains(permiso.getIdPermiso());
			if ("PERMITIR".equals(efecto) && permitidoPorRol) {
				throw new IllegalArgumentException("Este cambio no es necesario porque el rol ya tiene ese comportamiento.");
			}
			if ("DENEGAR".equals(efecto) && !permitidoPorRol) {
				throw new IllegalArgumentException("Este cambio no es necesario porque el rol ya tiene ese comportamiento.");
			}

			upsertOverride(usuario, permiso, efecto, motivo, idEmpresa, user);
		}

		return buildEffectivePermissions(usuario, idEmpresa);
	}

	@Override
	@Transactional
	public UsuarioPermisosEfectivosDTO deleteOverride(Integer idUsuario, Integer idPermiso, Integer idEmpresa,
			String user) {
		validateRequesterCanManageOverrides(user, idEmpresa);
		UsuariosEntity usuario = getUsuarioInEmpresa(idUsuario, idEmpresa);
		validateTargetEditable(usuario, user);
		PermisosEntity permiso = permisosRepository.findById(idPermiso)
				.orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + idPermiso));
		deactivateOverrides(usuario.getIdUsuario(), permiso.getIdPermiso(), idEmpresa, user);
		return buildEffectivePermissions(usuario, idEmpresa);
	}

	private UsuarioPermisosEfectivosDTO buildEffectivePermissions(UsuariosEntity usuario, Integer idEmpresa) {
		List<PermisosEntity> permisos = permisosRepository.findByEstatusTrueOrderByModuloAscNombreAsc();
		Set<Integer> rolePermissionIds = inheritedPermissionIds(usuario);
		Map<Integer, UsuariosPermisosEntity> overrides = activeOverridesMap(usuario.getIdUsuario(), idEmpresa);

		UsuarioPermisosEfectivosDTO dto = new UsuarioPermisosEfectivosDTO();
		dto.setUsuario(toUsuarioInfo(usuario));
		dto.setRol(toRolInfo(usuario));

		for (PermisosEntity permiso : permisos) {
			UsuariosPermisosEntity override = overrides.get(permiso.getIdPermiso());
			String efecto = override != null ? normalizeEffectLoose(override.getEfecto()) : null;
			boolean permitidoPorRol = rolePermissionIds.contains(permiso.getIdPermiso());
			boolean efectivo = "PERMITIR".equals(efecto) || (permitidoPorRol && !"DENEGAR".equals(efecto));

			UsuarioPermisosEfectivosDTO.PermisoEfectivo item = new UsuarioPermisosEfectivosDTO.PermisoEfectivo();
			item.setIdPermiso(permiso.getIdPermiso());
			item.setClave(permiso.getClave());
			item.setModulo(permiso.getModulo());
			item.setAccion(permiso.getAccion());
			item.setNombre(permiso.getNombre());
			item.setDescripcion(permiso.getDescripcion());
			item.setPermitidoPorRol(permitidoPorRol);
			item.setOverride(efecto);
			item.setEfectivo(efectivo);
			item.setMotivo(override != null ? override.getMotivo() : null);
			item.setRiesgo(riskLabel(permiso));
			item.setNoOverrideable(isNoOverrideable(permiso));
			item.setUsuarioAutorizo(override != null ? lastActor(override) : null);
			item.setFechaOverride(override != null ? overrideDate(override) : null);
			dto.getPermisos().add(item);

			if (efectivo) dto.getResumen().setPermisosEfectivos(dto.getResumen().getPermisosEfectivos() + 1);
		}

		dto.getOverridesActivos().addAll(overrides.values().stream()
				.sorted(Comparator.comparing((UsuariosPermisosEntity up) -> safe(up.getPermiso().getModulo()))
						.thenComparing(up -> safe(up.getPermiso().getNombre())))
				.map(this::toOverrideActivo)
				.toList());
		dto.getResumen().setPermisosHeredados(rolePermissionIds.size());
		dto.getResumen().setOverridesActivos(dto.getOverridesActivos().size());
		dto.getResumen().setPermitidosPorExcepcion((int) dto.getOverridesActivos().stream()
				.filter(item -> "PERMITIR".equals(item.getEfecto())).count());
		dto.getResumen().setDenegadosPorExcepcion((int) dto.getOverridesActivos().stream()
				.filter(item -> "DENEGAR".equals(item.getEfecto())).count());
		dto.getResumen().setOverridesCriticos((int) dto.getOverridesActivos().stream()
				.filter(item -> isCriticalRiskLabel(item.getRiesgo())).count());
		dto.getResumen().setRequiereRolNuevo(dto.getResumen().getOverridesActivos() >= 4);
		return dto;
	}

	private Map<Integer, UsuariosPermisosEntity> activeOverridesMap(Integer idUsuario, Integer idEmpresa) {
		Map<Integer, UsuariosPermisosEntity> map = new HashMap<>();
		usuariosPermisosRepository.findActiveByUsuarioAndEmpresa(idUsuario, idEmpresa)
				.forEach(up -> map.put(up.getPermiso().getIdPermiso(), up));
		return map;
	}

	private void upsertOverride(UsuariosEntity usuario, PermisosEntity permiso, String efecto, String motivo,
			Integer idEmpresa, String user) {
		List<UsuariosPermisosEntity> existing = usuariosPermisosRepository.findByUsuarioPermisoAndEmpresa(
				usuario.getIdUsuario(), permiso.getIdPermiso(), idEmpresa);
		UsuariosPermisosEntity active = existing.stream()
				.filter(item -> Boolean.TRUE.equals(item.getEstatus()))
				.findFirst()
				.orElse(null);

		if (active == null) {
			active = new UsuariosPermisosEntity();
			active.setUsuario(usuario);
			active.setPermiso(permiso);
			active.setUsuarioCreacion(user);
		}

		active.setEstatus(true);
		active.setEfecto(efecto);
		active.setMotivo(motivo);
		active.setUsuarioModificacion(user);
		UsuariosPermisosEntity saved = usuariosPermisosRepository.save(active);

		for (UsuariosPermisosEntity duplicate : existing) {
			if (Objects.equals(duplicate.getIdUsuariosPermisos(), saved.getIdUsuariosPermisos())) continue;
			if (!Boolean.TRUE.equals(duplicate.getEstatus())) continue;
			duplicate.setEstatus(false);
			duplicate.setUsuarioModificacion(user);
			usuariosPermisosRepository.save(duplicate);
		}
	}

	private void deactivateOverrides(Integer idUsuario, Integer idPermiso, Integer idEmpresa, String user) {
		usuariosPermisosRepository.findByUsuarioPermisoAndEmpresa(idUsuario, idPermiso, idEmpresa).stream()
				.filter(item -> Boolean.TRUE.equals(item.getEstatus()))
				.forEach(item -> {
					item.setEstatus(false);
					item.setUsuarioModificacion(user);
					usuariosPermisosRepository.save(item);
				});
	}

	private Set<Integer> inheritedPermissionIds(UsuariosEntity usuario) {
		Integer idRol = usuario.getRol() != null ? usuario.getRol().getIdRol() : null;
		if (idRol == null) return Set.of();
		return rolesPermisosRepository.findActiveByRolWithPermiso(idRol).stream()
				.map(RolesPermisosEntity::getPermiso)
				.filter(Objects::nonNull)
				.map(PermisosEntity::getIdPermiso)
				.collect(Collectors.toCollection(HashSet::new));
	}

	private int countInheritedPermissions(Integer idRol) {
		if (idRol == null) return 0;
		return rolesPermisosRepository.findActiveByRolWithPermiso(idRol).size();
	}

	private UsuariosEntity getUsuarioInEmpresa(Integer idUsuario, Integer idEmpresa) {
		if (idEmpresa == null) throw new IllegalArgumentException("Header requerido faltante: idEmpresa");
		if (idUsuario == null) throw new IllegalArgumentException("idUsuario es requerido");
		return usuariosRepository.findByIdUsuarioAndEmpresa_IdEmpresa(idUsuario, idEmpresa)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado o no pertenece a tu empresa"));
	}

	private void validateRequesterCanManageOverrides(String user, Integer idEmpresa) {
		if (idEmpresa == null) throw new IllegalArgumentException("Header requerido faltante: idEmpresa");
		UsuariosEntity requester = usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(safe(user), idEmpresa)
				.orElseThrow(() -> new EntityNotFoundException("Usuario solicitante no encontrado"));
		if (isProtectedRole(requester)) return;
		Integer idRol = requester.getRol() != null ? requester.getRol().getIdRol() : null;
		boolean hasPermission = idRol != null
				&& rolesPermisosRepository.countByRol_IdRolAndPermiso_ClaveIgnoreCaseAndEstatusTrue(
						idRol, "CONFIG_OVERRIDES_GESTIONAR") > 0;
		if (!hasPermission) {
			throw new IllegalArgumentException("No tienes permiso para gestionar overrides de usuario");
		}
	}

	private void validateTargetEditable(UsuariosEntity usuario, String user) {
		if (isProtectedRole(usuario)) {
			throw new IllegalArgumentException("El Administrador es protegido y sus permisos no pueden modificarse.");
		}
		if (safe(usuario.getUsuario()).equalsIgnoreCase(safe(user))) {
			throw new IllegalArgumentException("No puedes modificar tus propias excepciones de seguridad desde esta pantalla.");
		}
	}

	private UsuarioPermisosEfectivosDTO.UsuarioInfo toUsuarioInfo(UsuariosEntity usuario) {
		UsuarioPermisosEfectivosDTO.UsuarioInfo info = new UsuarioPermisosEfectivosDTO.UsuarioInfo();
		info.setIdUsuario(usuario.getIdUsuario());
		info.setNombreUsuario(usuario.getNombreUsuario());
		info.setUsuario(usuario.getUsuario());
		info.setCorreo(usuario.getCorreo());
		info.setTelefono(usuario.getTelefono());
		info.setAvatarUrl(usuario.getAvatarUrl());
		info.setActivo(isActiveUser(usuario));
		info.setProtegido(isProtectedRole(usuario));
		return info;
	}

	private UsuarioPermisosEfectivosDTO.RolInfo toRolInfo(UsuariosEntity usuario) {
		UsuarioPermisosEfectivosDTO.RolInfo info = new UsuarioPermisosEfectivosDTO.RolInfo();
		if (usuario.getRol() != null) {
			info.setIdRol(usuario.getRol().getIdRol());
			info.setNombreRol(usuario.getRol().getNombreRol());
			info.setProtegido(isProtectedRole(usuario));
		}
		return info;
	}

	private UsuarioPermisosEfectivosDTO.OverrideActivo toOverrideActivo(UsuariosPermisosEntity up) {
		PermisosEntity permiso = up.getPermiso();
		UsuarioPermisosEfectivosDTO.OverrideActivo item = new UsuarioPermisosEfectivosDTO.OverrideActivo();
		item.setIdUsuariosPermisos(up.getIdUsuariosPermisos());
		item.setIdPermiso(permiso.getIdPermiso());
		item.setClave(permiso.getClave());
		item.setModulo(permiso.getModulo());
		item.setNombre(permiso.getNombre());
		item.setEfecto(normalizeEffectLoose(up.getEfecto()));
		item.setMotivo(up.getMotivo());
		item.setRiesgo(riskLabel(permiso));
		item.setNoOverrideable(isNoOverrideable(permiso));
		item.setUsuarioAutorizo(lastActor(up));
		item.setFecha(overrideDate(up));
		return item;
	}

	private String normalizeEffect(String value) {
		String effect = normalizeKey(value);
		if ("PERMITIR".equals(effect) || "DENEGAR".equals(effect) || "HEREDADO".equals(effect)) {
			return effect;
		}
		throw new IllegalArgumentException("Efecto invalido. Usa PERMITIR, DENEGAR o HEREDADO.");
	}

	private String normalizeEffectLoose(String value) {
		String effect = normalizeKey(value);
		if ("PERMITIR".equals(effect) || "DENEGAR".equals(effect)) return effect;
		return null;
	}

	private String normalizeMotivo(String value) {
		String motivo = safe(value).replaceAll("\\s+", " ").trim();
		if (motivo.length() < 5) {
			throw new IllegalArgumentException("El motivo debe tener al menos 5 caracteres.");
		}
		if (motivo.length() > 500) {
			throw new IllegalArgumentException("El motivo no debe superar 500 caracteres.");
		}
		return motivo;
	}

	private boolean isNoOverrideable(PermisosEntity permiso) {
		String key = normalizeKey(permiso != null ? permiso.getClave() : "");
		return NON_OVERRIDEABLE_KEYS.contains(key) || key.startsWith("CONFIG_ROLES_");
	}

	private String riskLabel(PermisosEntity permiso) {
		String key = normalizeKey(permiso != null ? permiso.getClave() : "");
		String module = normalizeKey(permiso != null ? permiso.getModulo() : "");
		String action = normalizeKey(permiso != null ? permiso.getAccion() : "");

		if (key.contains("ELIMINAR") || key.contains("RESTAURAR") || key.contains("CANCELAR")
				|| action.contains("ELIMINAR") || action.contains("CANCELAR")) {
			return "Destructivo";
		}
		if (module.equals("CONFIGURACION") || module.equals("CAJA") || key.contains("PASSWORD")
				|| key.contains("COSTO") || key.contains("UTILIDAD") || key.contains("AJUST")) {
			return "Critico";
		}
		if (action.contains("VER") || key.endsWith("_VER")) {
			return "Consulta";
		}
		return "Operacion";
	}

	private boolean isCriticalRisk(PermisosEntity permiso) {
		return isCriticalRiskLabel(riskLabel(permiso));
	}

	private boolean isCriticalRiskLabel(String label) {
		return "Critico".equals(label) || "Destructivo".equals(label);
	}

	private boolean isActiveUser(UsuariosEntity usuario) {
		return usuario != null
				&& usuario.getActivo() != null
				&& usuario.getActivo().intValue() != 0
				&& !Boolean.FALSE.equals(usuario.getEstatus());
	}

	private boolean isProtectedRole(UsuariosEntity usuario) {
		String role = usuario != null && usuario.getRol() != null ? usuario.getRol().getNombreRol() : "";
		return PROTECTED_ROLE_NAMES.contains(normalizeKey(role));
	}

	private String normalizeKey(String value) {
		String noAccents = Normalizer.normalize(safe(value), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "");
		return noAccents.trim().replaceAll("\\s+", "_").replaceAll("[-:.]+", "_").toUpperCase();
	}

	private String safe(String value) {
		return value == null ? "" : value.trim();
	}

	private String lastActor(UsuariosPermisosEntity up) {
		return safe(up.getUsuarioModificacion()).isBlank() ? up.getUsuarioCreacion() : up.getUsuarioModificacion();
	}

	private LocalDateTime overrideDate(UsuariosPermisosEntity up) {
		return up.getFechaModificacion() != null ? up.getFechaModificacion() : up.getFechaCreacion();
	}
}
