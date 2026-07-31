package com.galtekone.services;

import com.galtekone.dto.pagos.ConfiguracionPagosDTO;
import com.galtekone.dto.pagos.TerminalPagoConfigDTO;
import com.galtekone.entity.ConfiguracionPagosEntity;

import java.util.List;

public interface ConfiguracionPagosService {
    ConfiguracionPagosDTO getConfiguracion(String user);
    ConfiguracionPagosDTO updateConfiguracion(ConfiguracionPagosDTO request, String user);
    ConfiguracionPagosEntity getOrCreate(Integer empresaId, String user);
    List<TerminalPagoConfigDTO> getTerminales(ConfiguracionPagosEntity configuracion);
    TerminalPagoConfigDTO resolveTerminal(ConfiguracionPagosEntity configuracion, String terminalKey);
}
