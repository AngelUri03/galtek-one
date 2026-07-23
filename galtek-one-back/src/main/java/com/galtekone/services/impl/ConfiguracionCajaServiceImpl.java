package com.galtekone.services.impl;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.ConfiguracionCajaDTO;
import com.galtekone.entity.CajaPoliticaOperacion;
import com.galtekone.entity.ConfiguracionCajaEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.ConfiguracionCajaRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.ConfiguracionCajaService;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfiguracionCajaServiceImpl implements ConfiguracionCajaService {

    private final ConfiguracionCajaRepository configuracionCajaRepository;
    private final UsuariosRepository usuariosRepository;
    private final CajaPermisosResolver permisosResolver;

    @Override
    @Transactional(readOnly = true)
    public ConfiguracionCajaDTO getConfiguracion(String user) {
        Integer empresaId = requireEmpresaId();
        findUsuario(user, empresaId);
        return toDTO(configuracionCajaRepository.findByEmpresa_IdEmpresaAndEstatusTrue(empresaId)
                .orElseGet(() -> defaultConfig(empresaId, user)));
    }

    @Override
    @Transactional
    public ConfiguracionCajaDTO updateConfiguracion(ConfiguracionCajaDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_MANAGE_POLICY", "CONFIG_CAJA_EDITAR")) {
            throw new CajaOperacionException("CASH_POLICY_FORBIDDEN",
                    "El usuario no tiene permiso para modificar politicas de caja.", HttpStatus.FORBIDDEN);
        }

        ConfiguracionCajaEntity entity = getOrCreate(empresaId, user);
        if (request.getHandoffPolicy() != null) {
            entity.setHandoffPolicy(CajaPoliticaOperacion.valueOf(normalize(request.getHandoffPolicy())));
        }
        if (request.getRequireIncomingCountOnUserChange() != null) {
            entity.setRequireIncomingCountOnUserChange(request.getRequireIncomingCountOnUserChange());
        }
        if (request.getRequireOutgoingCount() != null) {
            entity.setRequireOutgoingCount(request.getRequireOutgoingCount());
        }
        if (request.getAllowContinueWithPendingIncident() != null) {
            entity.setAllowContinueWithPendingIncident(request.getAllowContinueWithPendingIncident());
        } else {
            entity.setAllowContinueWithPendingIncident(
                    entity.getHandoffPolicy() == CajaPoliticaOperacion.CONTINUITY_FIRST);
        }
        if (request.getBlindCountEnabled() != null) {
            entity.setBlindCountEnabled(request.getBlindCountEnabled());
        }
        if (request.getExpectedBalanceVisibilityMode() != null
                && !request.getExpectedBalanceVisibilityMode().isBlank()) {
            entity.setExpectedBalanceVisibilityMode(normalize(request.getExpectedBalanceVisibilityMode()));
        }
        entity.setUsuarioModificacion(user);
        return toDTO(configuracionCajaRepository.save(entity));
    }

    @Override
    @Transactional
    public ConfiguracionCajaEntity getOrCreate(Integer empresaId, String user) {
        return configuracionCajaRepository.findByEmpresa_IdEmpresaAndEstatusTrue(empresaId)
                .orElseGet(() -> defaultConfig(empresaId, user));
    }

    private ConfiguracionCajaEntity defaultConfig(Integer empresaId, String user) {
        ConfiguracionCajaEntity entity = new ConfiguracionCajaEntity();
        entity.setEmpresa(empresaRef(empresaId));
        entity.setHandoffPolicy(CajaPoliticaOperacion.CONTINUITY_FIRST);
        entity.setRequireIncomingCountOnUserChange(true);
        entity.setRequireOutgoingCount(true);
        entity.setAllowContinueWithPendingIncident(true);
        entity.setBlindCountEnabled(true);
        entity.setExpectedBalanceVisibilityMode("PERMISSION_REQUIRED");
        entity.setUsuarioCreacion(user);
        return entity;
    }

    private ConfiguracionCajaDTO toDTO(ConfiguracionCajaEntity entity) {
        ConfiguracionCajaDTO dto = new ConfiguracionCajaDTO();
        dto.setHandoffPolicy(entity.getHandoffPolicy().name());
        dto.setRequireIncomingCountOnUserChange(entity.getRequireIncomingCountOnUserChange());
        dto.setRequireOutgoingCount(entity.getRequireOutgoingCount());
        dto.setAllowContinueWithPendingIncident(entity.getAllowContinueWithPendingIncident());
        dto.setBlindCountEnabled(entity.getBlindCountEnabled());
        dto.setExpectedBalanceVisibilityMode(entity.getExpectedBalanceVisibilityMode());
        return dto;
    }

    private Integer requireEmpresaId() {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        if (empresaId == null) {
            throw new CajaOperacionException("CASH_COMPANY_CONTEXT_MISSING",
                    "No se encontro empresa activa en la sesion.", HttpStatus.UNAUTHORIZED);
        }
        return empresaId;
    }

    private UsuariosEntity findUsuario(String user, Integer empresaId) {
        if (user == null || user.isBlank()) {
            throw new CajaOperacionException("CASH_USER_CONTEXT_MISSING",
                    "No se encontro usuario autenticado.", HttpStatus.UNAUTHORIZED);
        }
        return usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new CajaOperacionException("CASH_USER_NOT_FOUND",
                        "Usuario no encontrado en la empresa activa.", HttpStatus.UNAUTHORIZED));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private EmpresasEntity empresaRef(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }
}
