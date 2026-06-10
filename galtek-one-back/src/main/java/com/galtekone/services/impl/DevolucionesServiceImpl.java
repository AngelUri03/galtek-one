package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.DevolucionesEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.DevolucionesRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.DevolucionesService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class DevolucionesServiceImpl implements DevolucionesService {

    @Autowired
    private DevolucionesRepository devolucionesRepository;

    @Autowired
    private VentasRepository ventasRepository;

    @Override
    public DevolucionesEntity create(DevolucionesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (obj.getVenta() == null || obj.getVenta().getIdVenta() == null) {
            throw new IllegalArgumentException("Debe especificar una venta válida");
        }

        VentasEntity ventaReal = ventasRepository.findById(obj.getVenta().getIdVenta())
            .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + obj.getVenta().getIdVenta()));

        if (!ventaReal.getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("La venta no pertenece a la empresa actual");
        }

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        obj.setVenta(ventaReal);
        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);

        return devolucionesRepository.save(obj);
    }

    @Override
    public List<DevolucionesEntity> read(Specification<DevolucionesEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<DevolucionesEntity> filtroEmpresa = (root, query, cb) ->
            cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<DevolucionesEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return devolucionesRepository.findAll(finalSpec);
    }

    @Override
    public DevolucionesEntity update(DevolucionesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<DevolucionesEntity> optional = devolucionesRepository.findById(obj.getIdDevolucion());

        if (optional.isEmpty()) {
            throw new EntityNotFoundException("Devolución no encontrada con ID: " + obj.getIdDevolucion());
        }

        DevolucionesEntity entityToUpdate = optional.get();

        if (!entityToUpdate.getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("La devolución no pertenece a la empresa actual");
        }

        if (obj.getVenta() != null && obj.getVenta().getIdVenta() != null) {
            VentasEntity ventaReal = ventasRepository.findById(obj.getVenta().getIdVenta())
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + obj.getVenta().getIdVenta()));

            if (!ventaReal.getEmpresa().getIdEmpresa().equals(empresaId)) {
                throw new EntityNotFoundException("La venta no pertenece a la empresa actual");
            }

            entityToUpdate.setVenta(ventaReal);
        }

        if (obj.getTotalDevolucion() != null) {
            entityToUpdate.setTotalDevolucion(obj.getTotalDevolucion());
        }

        if (obj.getMotivo() != null) {
            entityToUpdate.setMotivo(obj.getMotivo());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return devolucionesRepository.save(entityToUpdate);
    }

    @Override
    public DevolucionesEntity delete(Integer idDevolucion, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<DevolucionesEntity> optional = devolucionesRepository.findById(idDevolucion);

        if (optional.isEmpty()) {
            throw new EntityNotFoundException("Devolución no encontrada con ID: " + idDevolucion);
        }

        DevolucionesEntity entity = optional.get();

        if (!entity.getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("La devolución no pertenece a la empresa actual");
        }

        entity.setUsuarioModificacion(user);
        devolucionesRepository.deleteById(idDevolucion);

        return entity;
    }
}