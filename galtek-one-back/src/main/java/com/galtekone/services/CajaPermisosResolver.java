package com.galtekone.services;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.RolesPermisosRepository;
import com.galtekone.repository.UsuariosPermisosRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CajaPermisosResolver {

    private final RolesPermisosRepository rolesPermisosRepository;
    private final UsuariosPermisosRepository usuariosPermisosRepository;

    public boolean hasAny(UsuariosEntity usuario, String... permissionKeys) {
        if (usuario == null || usuario.getEmpresa() == null || usuario.getRol() == null) {
            return false;
        }

        Set<String> requested = Arrays.stream(permissionKeys)
                .filter(key -> key != null && !key.isBlank())
                .map(this::normalize)
                .collect(Collectors.toSet());

        if (requested.isEmpty()) {
            return false;
        }

        var overrides = usuariosPermisosRepository.findActiveByUsuarioAndEmpresa(
                usuario.getIdUsuario(),
                usuario.getEmpresa().getIdEmpresa());

        for (var override : overrides) {
            String key = normalize(override.getPermiso() != null ? override.getPermiso().getClave() : null);
            if (!requested.contains(key)) {
                continue;
            }
            String efecto = normalize(override.getEfecto());
            if ("DENEGAR".equals(efecto)) {
                return false;
            }
            if ("PERMITIR".equals(efecto)) {
                return true;
            }
        }

        return rolesPermisosRepository.findActiveByRolWithPermiso(usuario.getRol().getIdRol()).stream()
                .anyMatch(rp -> requested.contains(normalize(
                        rp.getPermiso() != null ? rp.getPermiso().getClave() : null)));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
