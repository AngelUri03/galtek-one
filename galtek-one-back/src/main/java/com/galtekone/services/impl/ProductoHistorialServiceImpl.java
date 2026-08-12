package com.galtekone.services.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.ProductoHistorialEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.ProductoHistorialRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.ProductoHistorialService;
import com.galtekone.utils.EmpresaValidator;

@Service
@Transactional
public class ProductoHistorialServiceImpl implements ProductoHistorialService {

    @Autowired
    private ProductoHistorialRepository productoHistorialRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Override
    public ProductoHistorialEntity registrarEvento(
            ProductoHistorialEntity historial) {

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

        ProductosEntity producto =
                empresaValidator.validarEntidadPorEmpresa(
                        historial.getProducto().getIdProducto(),
                        empresaId,
                        "Producto",
                        productosRepository::findByIdProductoAndEmpresa_IdEmpresa
                );

        historial.setProducto(producto);

        EmpresaValidator.asignarEmpresa(historial);

        if (historial.getFechaEvento() == null) {
            historial.setFechaEvento(LocalDateTime.now());
        }

        return productoHistorialRepository.save(historial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoHistorialEntity> obtenerHistorialProducto(
            Integer idProducto) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        // Validamos que el producto pertenezca a la empresa actual.
        empresaValidator.validarEntidadPorEmpresa(
                idProducto,
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        return productoHistorialRepository
                .findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        idProducto,
                        empresaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoHistorialEntity> obtenerHistorialProducto(
            Integer idProducto,
            Integer idEmpresa) {

        if (idEmpresa == null) {
            throw new IllegalArgumentException(
                    "El id de empresa no puede ser nulo");
        }

        empresaValidator.validarEntidadPorEmpresa(
                idProducto,
                idEmpresa,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        return productoHistorialRepository
                .findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        idProducto,
                        idEmpresa);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoHistorialEntity> obtenerPorTipoEvento(
            String tipoEvento) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        if (empresaId == null) {
            throw new IllegalStateException(
                    "No existe una empresa seleccionada en el contexto actual");
        }

        if (tipoEvento == null || tipoEvento.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo de evento es obligatorio");
        }

        return productoHistorialRepository
                .findByTipoEventoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        tipoEvento,
                        empresaId);
    }
}
