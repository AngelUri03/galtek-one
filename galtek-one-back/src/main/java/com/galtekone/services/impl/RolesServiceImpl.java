package com.galtekone.services.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.dto.rol.RolPermisosRequestDTO;
import com.galtekone.dto.rol.RolRequestDTO;
import com.galtekone.dto.rol.RolResponseDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.PermisosEntity;
import com.galtekone.entity.RolesEntity;
import com.galtekone.entity.RolesPermisosEntity;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.PermisosRepository;
import com.galtekone.repository.RolesPermisosRepository;
import com.galtekone.repository.RolesRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.RolesService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class RolesServiceImpl implements RolesService {

	@Autowired
	private RolesRepository rolesRepository;

	@Autowired
	private RolesPermisosRepository rolesPermisosRepository;

	@Autowired
	private PermisosRepository permisosRepository;

	@Autowired
	private EmpresasRepository empresasRepository;
	
	@Autowired
	private UsuariosRepository usuariosRepository;

	@Override
	public RolesEntity create(RolesEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return rolesRepository.save(obj);
	}

	@Override
	public RolResponseDTO create(Integer idEmpresa, RolRequestDTO body, String user) {
		if (idEmpresa == null)
			throw new IllegalArgumentException("Header requerido faltante: idEmpresa");

		String nombreRaw = body.getNombreRol();
		if (nombreRaw == null)
			throw new IllegalArgumentException("nombreRol es requerido");

		String nombreNorm = nombreRaw.trim().replaceAll("\\s+", " ");
		if (nombreNorm.isEmpty())
			throw new IllegalArgumentException("nombreRol es requerido");

		boolean exists = rolesRepository.existsByEmpresa_IdEmpresaAndNombreRolIgnoreCase(idEmpresa, nombreNorm);
		if (exists) {
			throw new IllegalArgumentException("Ya existe un rol con ese nombre para esta empresa.");
		}

		RolesEntity obj = new RolesEntity();
		obj.setNombreRol(nombreNorm);
		obj.setEstatus(body.getEstatus());
		obj.setUsuarioCreacion(user);

		EmpresasEntity empRef = empresasRepository.getReferenceById(idEmpresa);
		obj.setEmpresa(empRef);

		RolesEntity saved = rolesRepository.save(obj);

		RolResponseDTO resp = new RolResponseDTO();
		resp.setIdRol(saved.getIdRol());
		resp.setNombreRol(saved.getNombreRol());
		resp.setEstatus(saved.getEstatus());
		resp.setIdEmpresa(idEmpresa);
		resp.setPermisos(List.of());

		return resp;
	}

	@Override
	public List<RolesEntity> read(Specification<RolesEntity> specs) {
		List<RolesEntity> resp = rolesRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	@Transactional(readOnly = true)
	public List<RolResponseDTO> read(Integer idEmpresa) {

		if (idEmpresa == null) {
			throw new IllegalArgumentException("Header requerido faltante: idEmpresa");
		}

		List<Object[]> rows = rolesRepository.findRolesWithPermisosByEmpresa(idEmpresa);

		Map<Integer, RolResponseDTO> map = new LinkedHashMap<>();

		for (Object[] r : rows) {

			if (r[0] == null)
				continue;

			Integer idRol = ((Number) r[0]).intValue();

			RolResponseDTO dto = map.computeIfAbsent(idRol, k -> {
				RolResponseDTO x = new RolResponseDTO();
				x.setIdRol(idRol);
				x.setNombreRol((String) r[1]);
				x.setEstatus(r[2] != null && ((Number) r[2]).intValue() == 1);
				x.setIdEmpresa(idEmpresa);
				x.setPermisos(new ArrayList<>());
				return x;
			});

			if (r[3] != null) {
				Integer idPermiso = ((Number) r[3]).intValue();
				String nombrePermiso = (String) r[4];
				String clavePermiso = (String) r[5];

				dto.getPermisos().add(new RolResponseDTO.PermisoDTO(idPermiso, nombrePermiso, clavePermiso));
			}
		}

		return new ArrayList<>(map.values());
	}

	@Override
	public RolesEntity update(RolesEntity obj, String user) {
		Optional<RolesEntity> aux = rolesRepository.findById(obj.getIdRol());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Rol no encontrado con ID: " + obj.getIdRol());
		}

		RolesEntity entityToUpdate = aux.get();

		if (obj.getNombreRol() != null) {
			entityToUpdate.setNombreRol(obj.getNombreRol());
		}

		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return rolesRepository.save(entityToUpdate);
	}

	@Override
	@Transactional
	public RolResponseDTO update(Integer idEmpresa, Integer idRol, RolRequestDTO body, String user) {
		if (idEmpresa == null)
			throw new IllegalArgumentException("Header requerido faltante: idEmpresa");

		RolesEntity role = rolesRepository.findByIdRolAndEmpresa_IdEmpresa(idRol, idEmpresa).orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + idRol));

		String nombreNorm = normalizeNombre(body.getNombreRol());

		boolean exists = rolesRepository.existsByEmpresa_IdEmpresaAndNombreRolIgnoreCaseAndIdRolNot(idEmpresa, nombreNorm, idRol);
		if (exists)
			throw new IllegalArgumentException("Ya existe un rol con ese nombre.");

		role.setNombreRol(nombreNorm);
		if (body.getEstatus() != null)
			role.setEstatus(body.getEstatus());
		role.setUsuarioModificacion(user);

		RolesEntity saved = rolesRepository.save(role);

		return toRolResponseDTO(saved, idEmpresa, List.of());
	}

	@Override
	@Transactional
	public RolResponseDTO updatePermisos(Integer idEmpresa, Integer idRol, RolPermisosRequestDTO body, String user) {
		if (idEmpresa == null)
			throw new IllegalArgumentException("Header requerido faltante: idEmpresa");

		RolesEntity role = rolesRepository.findByIdRolAndEmpresa_IdEmpresa(idRol, idEmpresa).orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + idRol));

		Set<Integer> desiredIds = Optional.ofNullable(body.getPermisos()).orElse(List.of()).stream().filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));

		List<RolesPermisosEntity> existing = rolesPermisosRepository.findAllByRol_IdRol(idRol);
		Set<Integer> existingIds = existing.stream().map(rp -> rp.getPermiso().getIdPermiso()).collect(Collectors.toSet());

		Set<Integer> toRemove = new HashSet<>(existingIds);
		toRemove.removeAll(desiredIds);

		Set<Integer> toAdd = new HashSet<>(desiredIds);
		toAdd.removeAll(existingIds);

		if (!toRemove.isEmpty()) {
			rolesPermisosRepository.deleteByRol_IdRolAndPermiso_IdPermisoIn(idRol, toRemove);
		}

		if (!toAdd.isEmpty()) {
			List<PermisosEntity> perms = permisosRepository.findAllById(toAdd);

			Set<Integer> found = perms.stream().map(PermisosEntity::getIdPermiso).collect(Collectors.toSet());
			List<Integer> missing = toAdd.stream().filter(id -> !found.contains(id)).toList();
			if (!missing.isEmpty()) {
				throw new IllegalArgumentException("Permisos no encontrados (id): " + missing.stream().map(String::valueOf).collect(Collectors.joining(", ")));
			}

			for (PermisosEntity p : perms) {
				RolesPermisosEntity rp = new RolesPermisosEntity();
				rp.setRol(role);
				rp.setPermiso(p);
				rp.setEstatus(true);
				rp.setUsuarioCreacion(user);
				rolesPermisosRepository.save(rp);
			}
		}

		role.setUsuarioModificacion(user);
		rolesRepository.save(role);

		List<Object[]> rows = rolesRepository.findRolesWithPermisosByEmpresa(idEmpresa);
		return mapRolWithPermisos(idRol, idEmpresa, rows);
	}

	@Override
	public RolesEntity delete(Integer idRol, String user) {
		Optional<RolesEntity> optional = rolesRepository.findById(idRol);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Rol no encontrado con ID: " + idRol);
		}

		RolesEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		rolesRepository.deleteById(idRol);

		return entity;
	}
	
	@Override
	@Transactional
	public RolResponseDTO delete(Integer idEmpresa, Integer idRol, String user) {
	    if (idEmpresa == null) {
	        throw new IllegalArgumentException("Header requerido faltante: idEmpresa");
	    }
	    if (idRol == null) {
	        throw new IllegalArgumentException("idRol es requerido");
	    }

	    RolesEntity role = rolesRepository
	        .findByIdRolAndEmpresa_IdEmpresa(idRol, idEmpresa)
	        .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + idRol));

	    boolean hasUsers = usuariosRepository.existsByRol_IdRolAndEmpresa_IdEmpresa(idRol, idEmpresa);
	    if (hasUsers) {
	        throw new IllegalArgumentException("No se puede eliminar el rol porque tiene usuarios asignados.");
	    }

	    rolesPermisosRepository.deleteByRol_IdRol(idRol);

	    role.setUsuarioModificacion(user);
	    rolesRepository.save(role);

	    rolesRepository.delete(role);

	    RolResponseDTO resp = new RolResponseDTO();
	    resp.setIdRol(role.getIdRol());
	    resp.setNombreRol(role.getNombreRol());
	    resp.setEstatus(role.getEstatus());
	    resp.setIdEmpresa(idEmpresa);
	    resp.setPermisos(List.of());
	    return resp;
	}

	private String normalizeNombre(String raw) {
		if (raw == null)
			throw new IllegalArgumentException("nombreRol es requerido");
		String norm = raw.trim().replaceAll("\\s+", " ");
		if (norm.isEmpty())
			throw new IllegalArgumentException("nombreRol es requerido");
		return norm;
	}

	private RolResponseDTO toRolResponseDTO(RolesEntity e, Integer idEmpresa, List<RolResponseDTO.PermisoDTO> permisos) {
		RolResponseDTO dto = new RolResponseDTO();
		dto.setIdRol(e.getIdRol());
		dto.setNombreRol(e.getNombreRol());
		dto.setEstatus(e.getEstatus());
		dto.setIdEmpresa(idEmpresa);
		dto.setPermisos(permisos);
		return dto;
	}

	private RolResponseDTO mapRolWithPermisos(Integer idRol, Integer idEmpresa, List<Object[]> rows) {
		RolResponseDTO dto = null;

		for (Object[] r : rows) {
			if (r[0] == null)
				continue;

			Integer rowRolId = ((Number) r[0]).intValue();
			if (!rowRolId.equals(idRol))
				continue;

			if (dto == null) {
				dto = new RolResponseDTO();
				dto.setIdRol(rowRolId);
				dto.setNombreRol((String) r[1]);
				dto.setEstatus(r[2] != null && ((Number) r[2]).intValue() == 1);
				dto.setIdEmpresa(idEmpresa);
				dto.setPermisos(new ArrayList<>());
			}

			Integer idPermiso = (r[3] != null) ? ((Number) r[3]).intValue() : null;
			if (idPermiso != null) {
				dto.getPermisos().add(new RolResponseDTO.PermisoDTO(idPermiso, (String) r[4], (String) r[5]));
			}
		}

		if (dto == null)
			throw new EntityNotFoundException("Rol no encontrado con ID: " + idRol);
		return dto;
	}

}
