package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.galtekone.entity.ProductoEstadoStockEntity;
import com.galtekone.repository.ProductoEstadoStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EstadoStockEntity;
import com.galtekone.repository.EstadoStockRepository;
import com.galtekone.services.EstadoStockService;
import com.galtekone.utils.EmpresaValidator;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class EstadoStockServiceImpl implements EstadoStockService {

    @Autowired
    private EstadoStockRepository estadoStockRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Autowired
    private ProductoEstadoStockRepository productoEstadoStockRepository;

    @Override
    public EstadoStockEntity create(EstadoStockEntity obj, String user) {
        EmpresaValidator.asignarEmpresa(obj);
        obj.setUsuarioCreacion(user);
        return estadoStockRepository.save(obj);
    }

    @Override
    public List<EstadoStockEntity> read(Specification<EstadoStockEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<EstadoStockEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<EstadoStockEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return estadoStockRepository.findAll(finalSpec);
    }

    @Override
    @Transactional
    public EstadoStockEntity update(EstadoStockEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        EstadoStockEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdEstadoStock(),
                empresaId,
                "EstadoStock",
                estadoStockRepository::findByIdEstadoStockAndEmpresa_IdEmpresa);

        if (obj.getNombreEstado() != null) {
            entityToUpdate.setNombreEstado(obj.getNombreEstado());
        }
        if (obj.getEstatus() != null) {
            entityToUpdate.setEstatus(obj.getEstatus());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return estadoStockRepository.save(entityToUpdate);
    }

    @Override
    public EstadoStockEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<EstadoStockEntity> optional = estadoStockRepository.findById(id);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("EstadoStock no encontrado o no pertenece a tu empresa");
        }

        EstadoStockEntity entity = optional.get();
        entity.setUsuarioModificacion(user);
        estadoStockRepository.deleteById(id);

        return entity;
    }

    @Override
    public String calcularEstado(Integer idProducto, BigDecimal existencia) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        List<ProductoEstadoStockEntity> rangos =
                productoEstadoStockRepository
                        .findByProducto_IdProductoAndEmpresa_IdEmpresa(idProducto, empresaId);

        for (ProductoEstadoStockEntity r : rangos) {
            if (existencia.compareTo(r.getMinimo()) >= 0 &&
                    existencia.compareTo(r.getMaximo()) <= 0) {
                return r.getEstadoStock().getNombreEstado();
            }
        }

        return "SIN DEFINIR";
    }
}
