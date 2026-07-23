package com.galtekone.services;

import java.math.BigDecimal;

import com.galtekone.dto.caja.CajaSaldoInicializarRequestDTO;
import com.galtekone.dto.caja.CajaSaldoMovimientoRequestDTO;
import com.galtekone.dto.caja.CajaSaldoResumenDTO;
import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.SaldoEfectivoEntity;
import com.galtekone.entity.UsuariosEntity;

public interface CajaSaldoService {
    CajaSaldoResumenDTO inicializar(CajaSaldoInicializarRequestDTO request, String user);
    CajaSaldoResumenDTO getResumen(String user);
    MovimientoCajaDTO registrarEntrada(CajaSaldoMovimientoRequestDTO request, String user);
    MovimientoCajaDTO registrarRetiro(CajaSaldoMovimientoRequestDTO request, String user);
    SaldoEfectivoEntity requireInitializedBalance(LocalDeviceEntity device, Integer empresaId);
    MovimientoCajaEntity registrarMovimientoContinuo(
            LocalDeviceEntity device,
            CajaSesionEntity session,
            UsuariosEntity usuario,
            MovimientoCajaTipo tipo,
            String financialDirection,
            BigDecimal amount,
            String category,
            String reason,
            String referenceType,
            String referenceId,
            String idempotencyKey,
            String user);
}
