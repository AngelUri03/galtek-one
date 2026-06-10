package com.galtekone.services;

import java.time.LocalDateTime;

import com.galtekone.dto.reporte.ReporteGananciaDTO;

public interface ReporteFinancieroService {

    ReporteGananciaDTO getReporteGanancia(LocalDateTime desde, LocalDateTime hasta);

}

