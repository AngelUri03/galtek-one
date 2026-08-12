package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.HistorialCostosEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.HistorialCostosRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.HistorialCostosService;
import com.galtekone.utils.EmpresaValidator;
import org.springframework.data.jpa.domain.Specification;

@Service
@Transactional
public class HistorialCostosServiceImpl implements HistorialCostosService {

    @Autowired
    private HistorialCostosRepository historialCostosRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Override
    public HistorialCostosEntity registrarCambioCosto(
            HistorialCostosEntity historial) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        if (historial.getProducto() == null
                || historial.getProducto().getIdProducto() == null) {

            throw new IllegalArgumentException(
                    "El historial debe tener un producto asociado");
        }

        if (historial.getProveedor() == null
                || historial.getProveedor().getIdProveedor() == null) {

            throw new IllegalArgumentException(
                    "El historial debe tener un proveedor asociado");
        }

        if (historial.getCostoNuevo() == null) {
            throw new IllegalArgumentException(
                    "El costo nuevo es obligatorio");
        }

        /*
         * Validar que el producto pertenezca a la empresa actual.
         */
        ProductosEntity producto =
                empresaValidator.validarEntidadPorEmpresa(
                        historial.getProducto().getIdProducto(),
                        empresaId,
                        "Producto",
                        productosRepository::findByIdProductoAndEmpresa_IdEmpresa
                );

        /*
         * Validar que el proveedor pertenezca a la empresa actual.
         */
        ProveedoresEntity proveedor =
                empresaValidator.validarEntidadPorEmpresa(
                        historial.getProveedor().getIdProveedor(),
                        empresaId,
                        "Proveedor",
                        proveedoresRepository::findByIdProveedorAndEmpresa_IdEmpresa
                );

        historial.setProducto(producto);
        historial.setProveedor(proveedor);

        /*
         * Asignar la empresa actual.
         */
        EmpresaValidator.asignarEmpresa(historial);

        /*
         * Obtener el último costo registrado para ese producto.
         */
        Optional<HistorialCostosEntity> ultimoRegistro =
                historialCostosRepository
                        .findTopByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
                                producto.getIdProducto(),
                                empresaId);

        BigDecimal costoAnterior = ultimoRegistro
                .map(HistorialCostosEntity::getCostoNuevo)
                .orElse(BigDecimal.ZERO);

        /*
         * Evitar registrar un cambio si el costo realmente no cambió.
         */
        if (costoAnterior.compareTo(historial.getCostoNuevo()) == 0) {
            throw new IllegalArgumentException(
                    "El costo nuevo es igual al costo actual");
        }

        /*
         * Registrar los valores del cambio.
         */
        historial.setCostoAnterior(costoAnterior);

        historial.setDiferencia(
                historial.getCostoNuevo()
                        .subtract(costoAnterior));

        /*
         * Registrar fecha automáticamente.
         */
        if (historial.getFechaCambio() == null) {
            historial.setFechaCambio(LocalDateTime.now());
        }

        return historialCostosRepository.save(historial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialCostosEntity> obtenerHistorialProducto(
            Integer idProveedor,
            Integer idProducto) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        /*
         * Validar producto.
         */
        empresaValidator.validarEntidadPorEmpresa(
                idProducto,
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        /*
         * Validar proveedor.
         */
        empresaValidator.validarEntidadPorEmpresa(
                idProveedor,
                empresaId,
                "Proveedor",
                proveedoresRepository::findByIdProveedorAndEmpresa_IdEmpresa
        );

        return historialCostosRepository
                .findByProveedor_IdProveedorAndProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
                        idProveedor,
                        idProducto,
                        empresaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialCostosEntity> read(Specification<HistorialCostosEntity> spec) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        /*
         * Creamos una Especificación de seguridad que SIEMPRE obliga 
         * a filtrar por la empresa actual para que nadie vea datos ajenos.
         */
        Specification<HistorialCostosEntity> empresaSpec = (root, query, criteriaBuilder) -> 
                criteriaBuilder.equal(root.get("empresa").get("idEmpresa"), empresaId);

        /*
         * Combinamos la seguridad obligatoria con el filtro dinámico del Controller.
         */
        Specification<HistorialCostosEntity> finalSpec = Specification.where(empresaSpec).and(spec);

        return historialCostosRepository.findAll(finalSpec);
    }

}