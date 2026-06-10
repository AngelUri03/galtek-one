package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import com.galtekone.dto.producto.ProductoResponseDTO;
import com.galtekone.repository.CategoriasRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.CategoriasEntity;
//import com.one.shop.entity.EmpresasEntity;
import com.galtekone.entity.ProductosEntity;
//import com.one.shop.entity.UnidadesEntity;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.ProductosService;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.repository.ProveedorProductoRespository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.entity.UnidadesEntity;
import com.galtekone.repository.UnidadesRepository;
import com.galtekone.utils.EmpresaValidator;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProductosServiceImpl implements ProductosService {

	@Autowired
	private ProductosRepository productosRepository;

    @Autowired
    private CategoriasRepository categoriasRepository;

	@Autowired
	private EmpresaValidator empresaValidator;

    @Autowired
    private ProveedorProductoRespository proveedorProductoRepository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private UnidadesRepository unidadesRepository;

	@Override
    public ProductosEntity create(ProductosEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        CategoriasEntity categoria = empresaValidator.validarEntidadPorEmpresa(
                obj.getCategoria().getIdCategoria(),
                empresaId,
                "Categoria",
                categoriasRepository::findByIdCategoriaAndEmpresa_IdEmpresa
                );

        obj.setCategoria(categoria);
        EmpresaValidator.asignarEmpresa(obj);
        if (obj.getImagen() != null) {
            obj.setImagen(obj.getImagen());
        }
        obj.setUsuarioCreacion(user);
        return productosRepository.save(obj);
    }

	@Override
    public List<ProductosEntity> read(Specification<ProductosEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ProductosEntity> filtroEmpresa = (root, query, cb) ->
            cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ProductosEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return productosRepository.findAll(finalSpec);
    }

	@Override
    @Transactional
    public ProductosEntity update(ProductosEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProductosEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdProducto(),
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        if (obj.getNombreProducto() != null) {
            entityToUpdate.setNombreProducto(obj.getNombreProducto());
        }
        if (obj.getEstatus() != null) {
            entityToUpdate.setEstatus(obj.getEstatus());
        }
        if (obj.getUnidad() != null) {
            UnidadesEntity unidadValida = unidadesRepository.findById(obj.getUnidad().getIdUnidad())
                    .orElseThrow(() -> new EntityNotFoundException("Unidad no encontrada con ID: " + obj.getUnidad().getIdUnidad()));
            entityToUpdate.setUnidad(unidadValida);
        }
        if (obj.getCategoria() != null) {
            CategoriasEntity categoriaValida = empresaValidator.validarEntidadPorEmpresa(
                    obj.getCategoria().getIdCategoria(),
                    empresaId,
                    "Categoria",
                    categoriasRepository::findByIdCategoriaAndEmpresa_IdEmpresa
            );
            entityToUpdate.setCategoria(categoriaValida);
        }
        if (obj.getCodigoBarras() != null) {
            entityToUpdate.setCodigoBarras(obj.getCodigoBarras());
        }
        if (obj.getDescripcion() != null) {
            entityToUpdate.setDescripcion(obj.getDescripcion());
        }
        if (obj.getDireccion() != null) {
            entityToUpdate.setDireccion(obj.getDireccion());
        }
        if (obj.getPrecioVenta() != null) {
            entityToUpdate.setPrecioVenta(obj.getPrecioVenta());
        }
        if (obj.getImagen() != null) {
            entityToUpdate.setImagen(obj.getImagen());
        }

        entityToUpdate.setUsuarioModificacion(user);

        ProductosEntity savedProducto = productosRepository.save(entityToUpdate);

        // --- Lógica de actualización de Proveedor y Precio ---
        if (obj.getIdProveedor() != null && obj.getPrecioCompra() != null) {
            ProveedoresEntity proveedor = empresaValidator.validarEntidadPorEmpresa(
                    obj.getIdProveedor(),
                    empresaId,
                    "Proveedor",
                    proveedoresRepository::findByIdProveedorAndEmpresa_IdEmpresa
            );

            // Eliminar relación existente
            List<ProveedorProductoEntity> existentes = proveedorProductoRepository.findByProducto_IdProducto(savedProducto.getIdProducto());
            if (!existentes.isEmpty()) {
                proveedorProductoRepository.deleteAll(existentes);
            }

            // Crear nueva relación
            ProveedorProductoEntity nuevaRelacion = new ProveedorProductoEntity();
            nuevaRelacion.setProducto(savedProducto);
            nuevaRelacion.setProveedor(proveedor);
            nuevaRelacion.setPrecioCompra(obj.getPrecioCompra());
            nuevaRelacion.setEmpresa(savedProducto.getEmpresa());
            nuevaRelacion.setUsuarioCreacion(user);
            proveedorProductoRepository.save(nuevaRelacion);
        }

        return savedProducto;
    }

	@Override
    public ProductosEntity delete(Integer idProducto, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<ProductosEntity> optional = productosRepository.findById(idProducto);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Producto no encontrado o no pertenece a tu empresa");
        }

        ProductosEntity entity = optional.get();
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);
        productosRepository.save(entity);

        return entity;
    }

	@Override
    public List<ProductosEntity> findByCategoria(Integer idCategoria) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        return productosRepository.findByCategoria_IdCategoriaAndEmpresa_IdEmpresa(idCategoria, empresaId);
    }

    @Override
    public List<ProductoResponseDTO> listarProductosActivos() {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        List<ProductosEntity> productos = productosRepository
                .findByEmpresa_IdEmpresaAndEstatusTrue(empresaId);

        return productos.stream().map(p -> {

            ProductoResponseDTO dto = new ProductoResponseDTO();
            dto.setIdProducto(p.getIdProducto());
            dto.setNombreProducto(p.getNombreProducto());
            dto.setDescripcion(p.getDescripcion());
            dto.setCodigoBarras(p.getCodigoBarras());
            dto.setPrecioVenta(p.getPrecioVenta());
            dto.setImagen(p.getImagen());
            dto.setEsPesaje(p.getEsPesaje());

            // unidad
            if (p.getUnidad() != null) {
                dto.setNombreUnidad(p.getUnidad().getNombreUnidad());
            }

            // categoria
            if (p.getCategoria() != null) {
                dto.setIdCategoria(p.getCategoria().getIdCategoria());
            }

            // empresa
            if (p.getEmpresa() != null) {
                dto.setIdEmpresa(p.getEmpresa().getIdEmpresa());
            }

            return dto;
        }).toList();
    }



}
