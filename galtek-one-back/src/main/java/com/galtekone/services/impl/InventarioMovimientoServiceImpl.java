package com.galtekone.services.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.InventarioMovimientoEntity;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.InventarioMovimientoRepository;
import com.galtekone.services.InventarioMovimientoService;
import com.galtekone.config.EmpresaContextHolder;

@Service
@Transactional
public class InventarioMovimientoServiceImpl implements InventarioMovimientoService {

    @Autowired
    private InventarioMovimientoRepository inventarioMovimientoRepository;

    @Autowired
    private EmpresasRepository empresasRepository;

    @Override
    public InventarioMovimientoEntity registrarMovimiento(InventarioMovimientoEntity movimiento) {

        Integer idEmpresa = EmpresaContextHolder.getEmpresaId();

        EmpresasEntity empresa = empresasRepository.findById(idEmpresa)
                .orElseThrow(() ->
                        new RuntimeException("No se encontró la empresa con id: " + idEmpresa));

        movimiento.setEmpresa(empresa);

        if (movimiento.getFechaMovimiento() == null) {
            movimiento.setFechaMovimiento(LocalDateTime.now());
        }

        return inventarioMovimientoRepository.save(movimiento);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioMovimientoEntity> obtenerMovimientosProducto(Integer idProducto) {
        return inventarioMovimientoRepository
                .findByProducto_IdProductoOrderByFechaMovimientoDesc(idProducto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioMovimientoEntity> obtenerMovimientosLote(Integer idLote) {
        return inventarioMovimientoRepository
                .findByLote_IdLoteOrderByFechaMovimientoDesc(idLote);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioMovimientoEntity> obtenerMovimientosAlmacen(Integer idAlmacen) {
        return inventarioMovimientoRepository
                .findByAlmacen_IdAlmacenOrderByFechaMovimientoDesc(idAlmacen);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioMovimientoEntity> obtenerMovimientosProducto(
            Integer idProducto,
            Integer idEmpresa) {

        return inventarioMovimientoRepository
                .findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaMovimientoDesc(
                        idProducto,
                        idEmpresa);
    }

}