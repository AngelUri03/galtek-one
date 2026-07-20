package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.utils.EmpresaValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.HistorialCostosEntity;
import com.galtekone.repository.HistorialCostosRepository;
import com.galtekone.services.HistorialCostosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class HistorialCostosServiceImpl implements HistorialCostosService {
	
	@Autowired
	private HistorialCostosRepository historialCostosRepository;
    @Autowired
    private EmpresaValidator empresaValidator;
    @Autowired
    private ProveedoresRepository proveedoresRepository;
    @Autowired
    private ProductosRepository productosRepository;

	@Override
	public HistorialCostosEntity create(HistorialCostosEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
		// TODO Auto-generated method stub
        ProveedoresEntity proveedor = empresaValidator.validarEntidadPorEmpresa(
                obj.getProveedor().getIdProveedor(),
                empresaId,
                "Proveedor",
                proveedoresRepository::findByIdProveedorAndEmpresa_IdEmpresa
        );
        ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                obj.getProducto().getIdProducto(),
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );
        obj.setProveedor(proveedor);
        obj.setProducto(producto);
        EmpresaValidator.asignarEmpresa(obj);

        obj.setUsuarioCreacion(user);
		return historialCostosRepository.save(obj);
	}

    @Override
    public List<HistorialCostosEntity> read(Specification<HistorialCostosEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<HistorialCostosEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<HistorialCostosEntity> finalSpec = Specification.where(filtroEmpresa).and(specs);

        return historialCostosRepository.findAll(finalSpec);
    }



    @Override
    @Transactional
	public HistorialCostosEntity update(HistorialCostosEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
		// TODO Auto-generated method stub

        HistorialCostosEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdHistorialCostos(),
                empresaId,
                "Historial de costos",
                historialCostosRepository::findByIdHistorialCostosAndEmpresa_IdEmpresa
        );

		    if (obj.getPrecioCompra() != null) {
		        entityToUpdate.setPrecioCompra(obj.getPrecioCompra());
		    }

            if (obj.getProveedor() != null) {
                ProveedoresEntity proveedor = empresaValidator.validarEntidadPorEmpresa(
                        obj.getProveedor().getIdProveedor(),
                        empresaId,
                        "Proveedor",
                        proveedoresRepository::findByIdProveedorAndEmpresa_IdEmpresa
                );
                entityToUpdate.setProveedor(proveedor);
            }
            if (obj.getProducto() != null) {
                ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                        obj.getProducto().getIdProducto(),
                        empresaId,
                        "Producto",
                        productosRepository::findByIdProductoAndEmpresa_IdEmpresa
                );
                entityToUpdate.setProducto(producto);
            }

		    entityToUpdate.setUsuarioModificacion(user);

		    return historialCostosRepository.save(entityToUpdate);
    }

    @Override
    public HistorialCostosEntity delete(Integer idHistorialCostos, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<HistorialCostosEntity> optional = historialCostosRepository.findById(idHistorialCostos);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Historial de costos no encontrado o no pertenece a tu empresa");
        }
        HistorialCostosEntity entity = optional.get();
        entity.setUsuarioModificacion(user);
        historialCostosRepository.delete(entity);

        return entity;
    }


}
