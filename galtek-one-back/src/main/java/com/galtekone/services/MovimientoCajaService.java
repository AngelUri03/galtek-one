package com.galtekone.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.galtekone.dto.movimientoCaja.BalanceCajaDTO;
import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.MovimientoCajaEntity;

public interface MovimientoCajaService extends CommonService<MovimientoCajaEntity> {

    List<MovimientoCajaDTO> readDTO(org.springframework.data.jpa.domain.Specification<MovimientoCajaEntity> specs);

    Page<MovimientoCajaDTO> readDTOPage(org.springframework.data.jpa.domain.Specification<MovimientoCajaEntity> specs,
            Pageable pageable);

    BalanceCajaDTO getBalanceCaja(Integer idCaja, LocalDateTime desde, LocalDateTime hasta);

}

