package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.galtekone.dto.lote.LoteResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.AlmacenEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.InventarioEntity;
import com.galtekone.entity.LotesEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.AlmacenRepository;
import com.galtekone.repository.InventarioRepository;
import com.galtekone.repository.LotesRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.LotesService;
import com.galtekone.utils.EmpresaValidator;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class LotesServiceImpl implements LotesService {

    @Autowired
    private LotesRepository lotesRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private AlmacenRepository almacenRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Autowired
    private InventarioRepository inventarioRepository;

    @Override
    @Transactional
    public LotesEntity create(LotesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                obj.getProducto().getIdProducto(), empresaId, "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa);

        AlmacenEntity almacen = empresaValidator.validarEntidadPorEmpresa(
                obj.getAlmacen().getIdAlmacen(), empresaId, "Almacén",
                almacenRepository::findByIdAlmacenAndEmpresa_IdEmpresa);

        obj.setProducto(producto);
        obj.setAlmacen(almacen);

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        obj.setEmpresa(empresa);

        obj.setUsuarioCreacion(user);

        LotesEntity savedLote = lotesRepository.save(obj);

        // SYNC INVENTARIO
        // Incrementar inventario físico o crearlo si no existe
        InventarioEntity inventario = inventarioRepository
                .findByProducto_IdProductoAndAlmacen_IdAlmacenAndEmpresa_IdEmpresa(
                        producto.getIdProducto(),
                        almacen.getIdAlmacen(),
                        empresaId)
                .orElse(null);

        if (inventario == null) {
            inventario = new InventarioEntity();
            inventario.setProducto(producto);
            inventario.setAlmacen(almacen);
            inventario.setEmpresa(empresa);
            inventario.setExistencia(savedLote.getCantidad());
            inventario.setFechaUltimaCompra(java.time.LocalDateTime.now());
            inventario.setUsuarioCreacion(user);
        } else {
            inventario.setExistencia(inventario.getExistencia().add(savedLote.getCantidad()));
            inventario.setUsuarioModificacion(user);
        }
        inventarioRepository.save(inventario);

        return savedLote;
    }

    @Override
    public List<LotesEntity> read(Specification<LotesEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<LotesEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);
        return lotesRepository.findAll(Specification.where(specs).and(filtroEmpresa));
    }

    @Override
    @Transactional
    public LotesEntity update(LotesEntity obj, String user) {
        // Implementación básica para CRUD, generalmente no se editan cantidades
        // manualmente
        // excepto en ajustes. Mantenemos compatibilidad CRUD.
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        LotesEntity entity = lotesRepository.findByIdLoteAndEmpresa_IdEmpresa(obj.getIdLote(), empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (obj.getFechaCaducidad() != null)
            entity.setFechaCaducidad(obj.getFechaCaducidad());
        // Cantidad generalmente no se edita directamente por API simple, sino por
        // movimientos.
        // Pero si es soporte CRUD básico:
        if (obj.getCantidad() != null)
            entity.setCantidad(obj.getCantidad());

        entity.setUsuarioModificacion(user);
        LotesEntity saved = lotesRepository.save(entity);
        
        // Sincronizar inventario
        sincronizarInventario(saved.getProducto().getIdProducto(), saved.getAlmacen().getIdAlmacen(), empresaId);
        
        return saved;
    }

    @Override
    @Transactional
    public LotesEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        LotesEntity entity = lotesRepository.findByIdLoteAndEmpresa_IdEmpresa(id, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        // Lógica de borrado físico
        lotesRepository.delete(entity);
        
        // Sincronizar inventario
        sincronizarInventario(entity.getProducto().getIdProducto(), entity.getAlmacen().getIdAlmacen(), empresaId);
        
        return entity;
    }
    
    private void sincronizarInventario(Integer idProducto, Integer idAlmacen, Integer idEmpresa) {
        BigDecimal total = lotesRepository.sumCantidadByProductoAndAlmacen(idProducto, idAlmacen, idEmpresa);
        if (total == null) {
            total = BigDecimal.ZERO;
        }

        final BigDecimal finalTotal = total;

        inventarioRepository.findByProducto_IdProductoAndAlmacen_IdAlmacenAndEmpresa_IdEmpresa(
                idProducto, idAlmacen, idEmpresa)
            .ifPresent(inv -> {
                inv.setExistencia(finalTotal);
                inventarioRepository.save(inv);
            });
    }

    @Override
    @Transactional
    public LotesEntity ajustarStock(com.galtekone.dto.lotes.AjusteLoteRequest request, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        LotesEntity lote = lotesRepository.findByIdLoteAndEmpresa_IdEmpresa(request.getIdLote(), empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        BigDecimal delta = request.getDelta() != null ? request.getDelta() : BigDecimal.ZERO;
        BigDecimal nuevaCantidad = lote.getCantidad().add(delta);
        
        if (nuevaCantidad.compareTo(BigDecimal.ZERO) < 0) {
            nuevaCantidad = BigDecimal.ZERO;
        }
        
        lote.setCantidad(nuevaCantidad);
        lote.setUsuarioModificacion(user);
        LotesEntity saved = lotesRepository.save(lote);

        // Aquí en un futuro se registrará el movimiento de inventario con request.getMotivo()

        sincronizarInventario(saved.getProducto().getIdProducto(), saved.getAlmacen().getIdAlmacen(), empresaId);

        return saved;
    }

    /**
     * Consume Stock usando estrategia FIFO/FEFO.
     * Actualiza simultáneamente la tabla física de Inventario.
     */
    @Override
    @Transactional
    public void descontarConsumo(Integer idProducto, Integer idAlmacen, BigDecimal cantidadSolicitada, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // 1. Validar inputs
        if (cantidadSolicitada.compareTo(BigDecimal.ZERO) <= 0)
            return;

        // 2. Obtener lotes disponibles con bloqueo pesimista. En POS el almacen
        // puede omitirse: se consume del inventario real del producto.
        List<LotesEntity> lotes = idAlmacen == null
                ? lotesRepository.findDisponiblesParaVentaEnEmpresa(idProducto, empresaId)
                : lotesRepository.findDisponiblesParaVenta(idProducto, idAlmacen, empresaId);

        BigDecimal cantidadRestante = cantidadSolicitada;
        Map<Integer, BigDecimal> consumoPorAlmacen = new LinkedHashMap<>();

        // 3. Iterar FIFO
        for (LotesEntity lote : lotes) {
            if (cantidadRestante.compareTo(BigDecimal.ZERO) <= 0)
                break;

            BigDecimal disponibleEnLote = lote.getCantidad();
            BigDecimal aDescontar;

            if (disponibleEnLote.compareTo(cantidadRestante) >= 0) {
                // El lote cubre todo lo que falta
                aDescontar = cantidadRestante;
                lote.setCantidad(disponibleEnLote.subtract(cantidadRestante));
                cantidadRestante = BigDecimal.ZERO;
            } else {
                // El lote se agota y falta más
                aDescontar = disponibleEnLote;
                lote.setCantidad(BigDecimal.ZERO);
                cantidadRestante = cantidadRestante.subtract(disponibleEnLote);
            }

            lote.setUsuarioModificacion(user);
            lotesRepository.save(lote);

            Integer almacenConsumido = lote.getAlmacen().getIdAlmacen();
            consumoPorAlmacen.merge(almacenConsumido, aDescontar, BigDecimal::add);
        }

        // 4. Validar si se cubrió la demanda
        if (cantidadRestante.compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Stock insuficiente en lotes. Faltan: " + cantidadRestante);
        }

        // 5. Sincronizar Inventario Fisico por almacen consumido.
        for (Map.Entry<Integer, BigDecimal> consumo : consumoPorAlmacen.entrySet()) {
            InventarioEntity inventario = inventarioRepository
                    .findByProducto_IdProductoAndAlmacen_IdAlmacenAndEmpresa_IdEmpresa(
                            idProducto,
                            consumo.getKey(),
                            empresaId)
                    .orElseThrow(() -> new RuntimeException(
                            "Inventario inconsistente: No existe registro de inventario para este producto"));

            BigDecimal nuevaExistencia = inventario.getExistencia().subtract(consumo.getValue());
            if (nuevaExistencia.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Inconsistencia critica: Inventario global menor que la suma de lotes.");
            }

            inventario.setExistencia(nuevaExistencia);
            inventario.setUsuarioModificacion(user);
            inventarioRepository.save(inventario);
        }
    }

    @Override
    public List<LoteResponseDTO> readDTO(
            Specification<LotesEntity> specs) {
        List<LotesEntity> entities = this.read(specs);

        return entities.stream().map(lote -> {
            LoteResponseDTO dto = new LoteResponseDTO();
            dto.setIdLote(lote.getIdLote());

            if (lote.getProducto() != null) {
                dto.setIdProducto(lote.getProducto().getIdProducto());
                dto.setNombreProducto(lote.getProducto().getNombreProducto());
            }

            if (lote.getAlmacen() != null) {
                dto.setIdAlmacen(lote.getAlmacen().getIdAlmacen());
                dto.setNombreAlmacen(lote.getAlmacen().getNombre());
            }

            dto.setCantidad(lote.getCantidad());
            dto.setFechaCaducidad(lote.getFechaCaducidad());

            return dto;
        }).collect(Collectors.toList());
    }
}
