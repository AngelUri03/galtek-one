package com.galtekone.services;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.galtekone.dto.caja.CajaAperturaRequestDTO;
import com.galtekone.dto.caja.CajaCierrePreviewDTO;
import com.galtekone.dto.caja.CajaCierreRequestDTO;
import com.galtekone.dto.caja.CajaCierreResultadoDTO;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.dto.caja.CajaSesionHistorialDTO;
import com.galtekone.dto.caja.CajaSesionResumenDTO;
import com.galtekone.entity.CajaSesionEntity;

public interface CajaSesionService {
    CajaEstadoActualDTO getEstadoActual(String user);
    CajaEstadoActualDTO abrir(CajaAperturaRequestDTO request, String user);
    CajaSesionEntity requireOpenSessionForCurrentInstallation(String user, Integer requestedCajaId);
    CajaSesionResumenDTO getResumenSesionActual(String user);
    CajaSesionResumenDTO revelarEfectivoEsperado(String user);
    CajaCierrePreviewDTO prepararCierreSesionActual(CajaCierreRequestDTO request, String user);
    CajaCierreResultadoDTO cerrarSesionActual(CajaCierreRequestDTO request, String user);
    Page<CajaSesionHistorialDTO> getHistorialSesiones(String user, LocalDateTime desde, LocalDateTime hasta,
            String query, String medium, Integer sessionId, Pageable pageable);
}
