package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import com.galtekone.dto.inventario.InventarioDTO;
import com.galtekone.dto.inventario.LoteDTO;
import com.galtekone.entity.AlmacenEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.repository.AlmacenRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.EstadoStockService;
import com.galtekone.utils.EmpresaValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.InventarioEntity;
import com.galtekone.repository.InventarioRepository;
import com.galtekone.services.InventarioService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class InventarioServiceImpl implements InventarioService {

	@Autowired
	private InventarioRepository inventarioRepository;
    @Autowired
    private EmpresaValidator empresaValidator;
    @Autowired
    private ProductosRepository productosRepository;
    @Autowired
    private AlmacenRepository almacenRepository;
    @Autowired
    private EstadoStockService estadoStockService;

    @Override
    @Transactional
    public InventarioEntity create(InventarioEntity obj, String user) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar producto
        ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                obj.getProducto().getIdProducto(),
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa
        );

        // Validar almacén
        AlmacenEntity almacen = empresaValidator.validarEntidadPorEmpresa(
                obj.getAlmacen().getIdAlmacen(),
                empresaId,
                "Almacén",
                almacenRepository::findByIdAlmacenAndEmpresa_IdEmpresa
        );

        // Verificar si ya existe inventario para ese producto + almacén + empresa
        Optional<InventarioEntity> existente = inventarioRepository
                .findByProducto_IdProductoAndAlmacen_IdAlmacenAndEmpresa_IdEmpresa(
                        producto.getIdProducto(),
                        almacen.getIdAlmacen(),
                        empresaId
                );

        if (existente.isPresent()) {
            throw new RuntimeException(
                    "Ya existe inventario para el producto " +
                            producto.getNombreProducto() +
                            " en el almacén " + almacen.getNombre()
            );
        }

        // Asignaciones seguras
        obj.setProducto(producto);
        obj.setAlmacen(almacen);

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        obj.setEmpresa(empresa);

        obj.setUsuarioCreacion(user);

        return inventarioRepository.save(obj);
    }

    @Override
	public List<InventarioEntity> read(Specification<InventarioEntity> specs) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();
        if (empresaId == null) {
            throw new IllegalStateException("Empresa no resuelta para la sesiÃ³n actual");
        }

	    Specification<InventarioEntity> filtroEmpresa = (root, query, cb) ->
	        cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

	    Specification<InventarioEntity> finalSpec = Specification.where(specs)
                .and(filtroEmpresa);

	    return inventarioRepository.findAll(finalSpec);
	}

    @Override
    @Transactional
    public InventarioEntity update(InventarioEntity obj, String user) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar que el inventario pertenece a la empresa
        InventarioEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdInventario(),
                empresaId,
                "Inventario",
                inventarioRepository::findByIdInventarioAndEmpresa_IdEmpresa
        );

        // Validar producto (si viene)
        if (obj.getProducto() != null) {
            ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                    obj.getProducto().getIdProducto(),
                    empresaId,
                    "Producto",
                    productosRepository::findByIdProductoAndEmpresa_IdEmpresa
            );
            entityToUpdate.setProducto(producto);
        }

        // Validar almacén (si viene)
        if (obj.getAlmacen() != null) {
            AlmacenEntity almacen = empresaValidator.validarEntidadPorEmpresa(
                    obj.getAlmacen().getIdAlmacen(),
                    empresaId,
                    "Almacén",
                    almacenRepository::findByIdAlmacenAndEmpresa_IdEmpresa
            );
            entityToUpdate.setAlmacen(almacen);
        }

        // Otros campos
        if (obj.getExistencia() != null) {
            entityToUpdate.setExistencia(obj.getExistencia());
        }

        if (obj.getFechaUltimaCompra() != null) {
            entityToUpdate.setFechaUltimaCompra(obj.getFechaUltimaCompra());
        }

        if (obj.getEstatus() != null) {
            entityToUpdate.setEstatus(obj.getEstatus());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return inventarioRepository.save(entityToUpdate);
    }

    @Override
	public InventarioEntity delete(Integer idInventario, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<InventarioEntity> optional = inventarioRepository.findById(idInventario);

	    if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Inventario no encontrado o no pertenece a tu empresa");
	    }

	    InventarioEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);

	    inventarioRepository.deleteById(idInventario);

	    return entity;
	}

    @Override
    @Transactional
    public List<InventarioDTO> getInventarioConEstado(Specification<InventarioEntity> specs) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        if (empresaId == null) {
            throw new IllegalStateException("Empresa no resuelta para la sesiÃ³n actual");
        }

        Specification<InventarioEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<InventarioEntity> fetchLotesSpec = (root, query, cb) -> {
            assert query != null;
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                query.distinct(true);
                jakarta.persistence.criteria.Fetch<Object, Object> prodFetch = root.fetch("producto", jakarta.persistence.criteria.JoinType.LEFT);
                prodFetch.fetch("lotes", jakarta.persistence.criteria.JoinType.LEFT);
            }
            return cb.conjunction();
        };

        List<InventarioEntity> data =
                inventarioRepository.findAll(Specification.where(specs)
                        .and(filtroEmpresa)
                        .and(fetchLotesSpec));

        return data.stream().map(inv -> {

            InventarioDTO dto = new InventarioDTO();
            dto.setIdInventario(inv.getIdInventario());

            dto.setIdProducto(inv.getProducto().getIdProducto());
            dto.setNombreProducto(inv.getProducto().getNombreProducto());
            dto.setExistencia(inv.getExistencia());
            dto.setAlmacen(inv.getAlmacen().getNombre());

            String estado = estadoStockService.calcularEstado(
                    inv.getProducto().getIdProducto(),
                    inv.getExistencia()
            );

            dto.setEstadoStock(estado);

            // --- Campos adicionales del Producto ---
            ProductosEntity prod = inv.getProducto();
            dto.setCodigoBarras(prod.getCodigoBarras());
            dto.setPrecioVenta(prod.getPrecioVenta());
            dto.setImagen(prod.getImagen());
            dto.setEsPesaje(prod.getEsPesaje());

            if (prod.getCategoria() != null) {
                dto.setIdCategoria(prod.getCategoria().getIdCategoria());
                dto.setCategoriaNombre(prod.getCategoria().getNombreCategoria());
            }

            if (prod.getUnidad() != null) {
                dto.setIdUnidad(prod.getUnidad().getIdUnidad());
            }

            // --- Primer proveedor y su precio de compra ---
            if (prod.getProveedores() != null && !prod.getProveedores().isEmpty()) {
                ProveedorProductoEntity pp = prod.getProveedores().getFirst();
                dto.setPrecioCompra(pp.getPrecioCompra());
                if (pp.getProveedor() != null) {
                    dto.setIdProveedor(pp.getProveedor().getIdProveedor());
                    dto.setProveedorNombre(pp.getProveedor().getNombreProveedor());
                }
            }

            // --- Metadatos ---
            dto.setEstatus(inv.getEstatus());
            dto.setFechaActualizacion(
                inv.getFechaModificacion() != null
                    ? inv.getFechaModificacion()
                    : inv.getFechaCreacion()
            );

            // --- Lotes ---
            if (prod.getLotes() != null && !prod.getLotes().isEmpty()) {
                List<LoteDTO> lotesList = prod.getLotes().stream()
                        .map(l -> {
                            LoteDTO loteDTO = new LoteDTO();
                            loteDTO.setIdLote(l.getIdLote());
                            loteDTO.setNumeroLote(String.valueOf(l.getIdLote()));
                            loteDTO.setCantidad(l.getCantidad());
                            loteDTO.setFechaExpiracion(l.getFechaCaducidad());
                            if (l.getAlmacen() != null) {
                                loteDTO.setUbicacion(l.getAlmacen().getNombre());
                            }
                            return loteDTO;
                        })
                        .collect(java.util.stream.Collectors.toList());
                dto.setLotes(lotesList);
            }

            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

}
