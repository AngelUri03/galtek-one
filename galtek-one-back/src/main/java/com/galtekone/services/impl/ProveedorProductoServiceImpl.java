package com.galtekone.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.repository.ProveedorProductoRespository;
import com.galtekone.services.ProveedorProductoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorProductoServiceImpl implements ProveedorProductoService {

	@Autowired
	private ProveedorProductoRespository proveedorProductoRepository;
	
    public ProveedorProductoEntity create(
            ProveedorProductoEntity obj,
            String user,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(idEmpresa);

        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);

        return proveedorProductoRepository.save(obj);
    }
    
    public List<ProveedorProductoEntity> read(
            Specification<ProveedorProductoEntity> specs,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        Specification<ProveedorProductoEntity> empresaSpec =
                (root, query, cb) ->
                        cb.equal(
                                root.get("empresa").get("idEmpresa"),
                                idEmpresa
                        );

        return proveedorProductoRepository.findAll(
                Specification.where(empresaSpec).and(specs)
        );
    }
    
    public ProveedorProductoEntity update(
            ProveedorProductoEntity obj,
            String user,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndEmpresa_IdEmpresa(
                        obj.getIdProveedorProducto(),
                        idEmpresa
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "ProveedorProducto no encontrado o no pertenece a la empresa"
                        )
                );

        if (obj.getProducto() != null) {
            entity.setProducto(obj.getProducto());
        }
        if (obj.getProveedor() != null) {
            entity.setProveedor(obj.getProveedor());
        }
        if (obj.getPrecioCompra() != null) {
            entity.setPrecioCompra(obj.getPrecioCompra());
        }

        entity.setUsuarioModificacion(user);

        return proveedorProductoRepository.save(entity);
    }
    
    public ProveedorProductoEntity delete(
            Integer idProveedorProducto,
            String user,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndEmpresa_IdEmpresa(
                        idProveedorProducto,
                        idEmpresa
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "ProveedorProducto no encontrado o no pertenece a la empresa"
                        )
                );

        entity.setUsuarioModificacion(user);
        proveedorProductoRepository.delete(entity);

        return entity;
    }
    
    @Override
    public ProveedorProductoEntity create(
            ProveedorProductoEntity obj,
            String user) {
        throw new UnsupportedOperationException(
                "Debe enviarse idEmpresa desde el header"
        );
    }

    @Override
    public List<ProveedorProductoEntity> read(
            Specification<ProveedorProductoEntity> specs) {
        throw new UnsupportedOperationException(
                "Debe enviarse idEmpresa desde el header"
        );
    }

    @Override
    public ProveedorProductoEntity update(
            ProveedorProductoEntity obj,
            String user) {
        throw new UnsupportedOperationException(
                "Debe enviarse idEmpresa desde el header"
        );
    }

    @Override
    public ProveedorProductoEntity delete(
            Integer id,
            String user) {
        throw new UnsupportedOperationException(
                "Debe enviarse idEmpresa desde el header"
        );
    }


}
