package com.galtekone.services;

import com.galtekone.dto.caja.ConfiguracionCajaDTO;
import com.galtekone.entity.ConfiguracionCajaEntity;

public interface ConfiguracionCajaService {
    ConfiguracionCajaDTO getConfiguracion(String user);
    ConfiguracionCajaDTO updateConfiguracion(ConfiguracionCajaDTO request, String user);
    ConfiguracionCajaEntity getOrCreate(Integer empresaId, String user);
}
