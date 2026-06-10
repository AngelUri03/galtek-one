package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.AlmacenEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.repository.AlmacenRepository;
import com.galtekone.services.AlmacenService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class AlmacenServiceImpl implements AlmacenService {

    @Autowired
    private AlmacenRepository almacenRepository;

    @Override
    public AlmacenEntity create(AlmacenEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);
        return almacenRepository.save(obj);
    }

    @Override
    public List<AlmacenEntity> read(Specification<AlmacenEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<AlmacenEntity> filtroEmpresa = (root, query, cb) ->
            cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<AlmacenEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return almacenRepository.findAll(finalSpec);
    }

    @Override
    public AlmacenEntity update(AlmacenEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<AlmacenEntity> aux = almacenRepository.findById(obj.getIdAlmacen());

        if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Almacen no encontrado o no pertenece a tu empresa");
        }

        AlmacenEntity entityToUpdate = aux.get();

        if (obj.getNombre() != null) {
            entityToUpdate.setNombre(obj.getNombre());
        }

        if (obj.getDireccion() != null) {
            entityToUpdate.setDireccion(obj.getDireccion());
        }

        if (obj.getEstatus() != null) {
            entityToUpdate.setEstatus(obj.getEstatus());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return almacenRepository.save(entityToUpdate);
    }

    @Override
    public AlmacenEntity delete(Integer idAlmacen, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<AlmacenEntity> optional = almacenRepository.findById(idAlmacen);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Almacen no encontrado o no pertenece a tu empresa");
        }

        AlmacenEntity entity = optional.get();
        entity.setUsuarioModificacion(user);
        almacenRepository.deleteById(idAlmacen);

        return entity;
    }
}
