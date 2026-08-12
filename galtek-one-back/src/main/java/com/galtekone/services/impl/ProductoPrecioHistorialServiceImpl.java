package com.galtekone.services.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.ProductoPrecioHistorialEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.ProductoPrecioHistorialRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.ProductoPrecioHistorialService;
import com.galtekone.utils.EmpresaValidator;

@Service
@Transactional
public class ProductoPrecioHistorialServiceImpl
        implements ProductoPrecioHistorialService {

    @Autowired
    private ProductoPrecioHistorialRepository productoPrecioHistorialRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Override
    public ProductoPrecioHistorialEntity registrarCambioPrecio(
            ProductoPrecioHistorialEntity historial) {

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

        historial.setProducto(producto);

        /*
         * Asignar automáticamente la empresa actual.
         */
        EmpresaValidator.asignarEmpresa(historial);

        /*
         * Asignar fecha automáticamente si no fue proporcionada.
         */
        if (historial.getFechaEvento() == null) {
            historial.setFechaEvento(LocalDateTime.now());
        }

        /*
         * Validar que exista un precio nuevo.
         */
        if (historial.getPrecioNuevo() == null) {
            throw new IllegalArgumentException(
                    "El precio nuevo es obligatorio");
        }

        /*
         * Si no se proporciona precio anterior, se utiliza cero.
         */
        if (historial.getPrecioAnterior() == null) {
            historial.setPrecioAnterior(
                    java.math.BigDecimal.ZERO);
        }

        return productoPrecioHistorialRepository.save(historial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoPrecioHistorialEntity> obtenerHistorialPrecios(
            Integer idProducto) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        /*
         * Verificar que el producto pertenezca a la empresa actual.
         */
        empresaValidator.validarEntidadPorEmpresa(
                idProducto,
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        return productoPrecioHistorialRepository
                .findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        idProducto,
                        empresaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoPrecioHistorialEntity> obtenerHistorialPrecios(
            Integer idProducto,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException(
                    "El id de empresa no puede ser nulo");
        }

        /*
         * Verificar que el producto pertenezca a la empresa indicada.
         */
        empresaValidator.validarEntidadPorEmpresa(
                idProducto,
                idEmpresa,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        return productoPrecioHistorialRepository
                .findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        idProducto,
                        idEmpresa);
    }
}