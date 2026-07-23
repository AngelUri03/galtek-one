package com.galtekone.services;

import java.math.BigDecimal;
import java.util.List;

import com.galtekone.dto.caja.CajaIncidenciaDTO;
import com.galtekone.dto.caja.CajaIncidenciaResolverRequestDTO;
import com.galtekone.entity.CajaIncidenciaEntity;
import com.galtekone.entity.CajaIncidenciaTipo;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaEntity;

public interface CajaIncidenciaService {
    CajaIncidenciaEntity crearIncidencia(
            CajaIncidenciaTipo type,
            LocalDeviceEntity device,
            CajaSesionEntity session,
            MovimientoCajaEntity movement,
            BigDecimal expectedAmount,
            BigDecimal outgoingDeclaredAmount,
            BigDecimal incomingDeclaredAmount,
            BigDecimal acceptedAmount,
            BigDecimal differenceAmount,
            String outgoingNote,
            String incomingNote,
            String policySnapshot,
            String user);

    List<CajaIncidenciaDTO> getPendientes(String user);
    CajaIncidenciaDTO resolver(Integer id, CajaIncidenciaResolverRequestDTO request, String user);
    long countPendingForDevice(String installationId, Integer empresaId);
}
