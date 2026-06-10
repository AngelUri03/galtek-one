package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.galtekone.dto.productoEstadoStock.ProductoEstadoStockResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EstadoStockEntity;
import com.galtekone.entity.ProductoEstadoStockEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.EstadoStockRepository;
import com.galtekone.repository.ProductoEstadoStockRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.ProductoEstadoStockService;
import com.galtekone.utils.EmpresaValidator;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class ProductoEstadoStockServiceImpl implements ProductoEstadoStockService {

    @Autowired
    private ProductoEstadoStockRepository repository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private EstadoStockRepository estadoStockRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    private static final int ORDEN_AGOTADO = 1;

    @Override
    @Transactional
    public ProductoEstadoStockEntity create(ProductoEstadoStockEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // 1. Validar Entidades (Producto y Estado) pertenezcan a la empresa
        ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                obj.getProducto().getIdProducto(),
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa);

        EstadoStockEntity estado = empresaValidator.validarEntidadPorEmpresa(
                obj.getEstadoStock().getIdEstadoStock(),
                empresaId,
                "EstadoStock",
                estadoStockRepository::findByIdEstadoStockAndEmpresa_IdEmpresa);

        obj.setProducto(producto);
        obj.setEstadoStock(estado);
        EmpresaValidator.asignarEmpresa(obj); // set empresaId

        // Lógica de Negocio Centralizada
        aplicarReglasDeNegocio(obj, empresaId, false);

        // Validar Existencia de Regla para este Estado (Duplicado)
        boolean existsState = repository.existsByProducto_IdProductoAndEstadoStock_IdEstadoStockAndEmpresa_IdEmpresa(
                producto.getIdProducto(), estado.getIdEstadoStock(), empresaId);

        if (existsState) {
            throw new RuntimeException("Ya existe una regla para este producto y estado de stock");
        }

        // Validar Solapamiento (Overlap)
        boolean overlap = repository.existsOverlap(
                producto.getIdProducto(),
                empresaId,
                obj.getMinimo(),
                obj.getMaximo());

        if (overlap) {
            throw new RuntimeException("El rango entra en conflicto con otra regla existente (solapamiento)");
        }

        obj.setUsuarioCreacion(user);
        return repository.save(obj);
    }

    @Override
    public List<ProductoEstadoStockEntity> read(Specification<ProductoEstadoStockEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ProductoEstadoStockEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ProductoEstadoStockEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return repository.findAll(finalSpec);
    }

    @Override
    @Transactional
    public ProductoEstadoStockEntity update(ProductoEstadoStockEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar existencia y pertenencia
        ProductoEstadoStockEntity entityToUpdate = repository
                .findByIdProductoEstadoStockAndEmpresa_IdEmpresa(obj.getIdProductoEstadoStock(), empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Regla no encontrada o no pertenece a su empresa"));

        // Si cambia Producto
        if (obj.getProducto() != null) {
            ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                    obj.getProducto().getIdProducto(),
                    empresaId,
                    "Producto",
                    productosRepository::findByIdProductoAndEmpresa_IdEmpresa);
            entityToUpdate.setProducto(producto);
        }

        // Si cambia Estado
        if (obj.getEstadoStock() != null) {
            EstadoStockEntity estado = empresaValidator.validarEntidadPorEmpresa(
                    obj.getEstadoStock().getIdEstadoStock(),
                    empresaId,
                    "EstadoStock",
                    estadoStockRepository::findByIdEstadoStockAndEmpresa_IdEmpresa);
            entityToUpdate.setEstadoStock(estado);
        }

        // Si cambian rangos
        if (obj.getMinimo() != null)
            entityToUpdate.setMinimo(obj.getMinimo());
        if (obj.getMaximo() != null)
            entityToUpdate.setMaximo(obj.getMaximo());

        // Lógica de Negocio Centralizada
        aplicarReglasDeNegocio(entityToUpdate, empresaId, true);

        // Validar solapamiento excluyendo el actual
        boolean overlap = repository.existsOverlapExcludeId(
                entityToUpdate.getProducto().getIdProducto(),
                empresaId,
                entityToUpdate.getMinimo(),
                entityToUpdate.getMaximo(),
                entityToUpdate.getIdProductoEstadoStock());

        if (overlap) {
            throw new RuntimeException("El rango entra en conflicto con otra regla existente (solapamiento)");
        }

        entityToUpdate.setUsuarioModificacion(user);
        return repository.save(entityToUpdate);
    }

    @Override
    public ProductoEstadoStockEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProductoEstadoStockEntity entity = repository.findByIdProductoEstadoStockAndEmpresa_IdEmpresa(id, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Regla no encontrada"));

        repository.delete(entity);
        return entity;
    }

    /**
     * Aplica las reglas de negocio solicitadas:
     * 1. AGOTADO (Orden 1) -> Min=0, Max=0.
     * 2. Ningún otro estado puede usar 0.
     * 3. Coherencia Lógica de Orden vs Rango.
     * 4. Validez básica (Min <= Max).
     */
    private void aplicarReglasDeNegocio(ProductoEstadoStockEntity regla, Integer empresaId, boolean isUpdate) {

        Integer orden = regla.getEstadoStock().getOrden();

        // Regla 1: Manejo Especial de AGOTADO
        if (orden != null && orden == ORDEN_AGOTADO) {
            regla.setMinimo(BigDecimal.ZERO);
            regla.setMaximo(BigDecimal.ZERO);
        } else {
            // Regla 1.1: Ningún otro estado puede usar 0
            // Si NO es agotado, el máximo no puede ser 0 (el mínimo podría ser > 0)
            // La regla estricta dice "Ningún otro estado puede usar el valor 0".
            // Si min o max son 0 (o menor), error.
            if (regla.getMinimo().compareTo(BigDecimal.ZERO) <= 0
                    || regla.getMaximo().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException(
                        "Rango inválido: el valor 0 solo puede usarse cuando el estado es AGOTADO.");

            }
        }

        // Regla Genérica: Min <= Max
        if (regla.getMinimo().compareTo(regla.getMaximo()) > 0) {
            throw new RuntimeException(String.format(
                    "Rango inválido: el mínimo (%s) no puede ser mayor que el máximo (%s).",
                    regla.getMinimo(), regla.getMaximo()));

        }

        boolean existeMismoEstado = repository
                .findByProducto_IdProductoAndEmpresa_IdEmpresa(
                        regla.getProducto().getIdProducto(), empresaId)
                .stream()
                .anyMatch(r -> !r.getIdProductoEstadoStock().equals(regla.getIdProductoEstadoStock()) &&
                        r.getEstadoStock().getIdEstadoStock().equals(regla.getEstadoStock().getIdEstadoStock()));

        if (existeMismoEstado) {
            throw new RuntimeException(
                    "Configuración inválida: ya existe una regla para el estado '" +
                            regla.getEstadoStock().getNombreEstado() + "' en este producto.");
        }

        // Regla 2: Coherencia Lógica (Orden)
        validarCoherenciaLogica(regla, empresaId, isUpdate);
    }

    private void validarCoherenciaLogica(ProductoEstadoStockEntity reglaActual, Integer empresaId, boolean isUpdate) {
        // Obtener todas las reglas existentes del producto
        List<ProductoEstadoStockEntity> reglasActuales = repository
                .findByProducto_IdProductoAndEmpresa_IdEmpresa(reglaActual.getProducto().getIdProducto(), empresaId);

        // Si es update, excluir la versión vieja de la regla actual de la lista
        if (isUpdate) {
            reglasActuales = reglasActuales.stream()
                    .filter(r -> !r.getIdProductoEstadoStock().equals(reglaActual.getIdProductoEstadoStock()))
                    .collect(Collectors.toList());
        }

        // Agregar la nueva versión de la regla a la lista (en memoria) para validar el
        // conjunto completo
        // Usamos una copia o un objeto nuevo para no afectar la persistencia si algo
        // falla
        reglasActuales.add(reglaActual);

        // Ordenar por orden del estado
        reglasActuales.sort(Comparator.comparingInt(r -> r.getEstadoStock().getOrden()));

        // Validar secuencia
        for (int i = 0; i < reglasActuales.size() - 1; i++) {
            ProductoEstadoStockEntity menor = reglasActuales.get(i);
            ProductoEstadoStockEntity mayor = reglasActuales.get(i + 1);

            // Regla: A.max < B.min
            // Si el MAX del estado MENOR es >= que el MIN del estado MAYOR, hay
            // incoherencia
            if (menor.getMaximo().compareTo(mayor.getMinimo()) >= 0) {
                throw new RuntimeException(String.format(
                        "Rango inconsistente: el estado '%s' (%s - %s) entra en conflicto con '%s' (%s - %s). " +
                                "Los estados con mayor jerarquía deben tener rangos mayores.",
                        menor.getEstadoStock().getNombreEstado(),
                        menor.getMinimo(), menor.getMaximo(),
                        mayor.getEstadoStock().getNombreEstado(),
                        mayor.getMinimo(), mayor.getMaximo()));

            }
        }
    }

    @Override
    public List<ProductoEstadoStockResponseDTO> readDTO(
            Specification<ProductoEstadoStockEntity> specs) {
        List<ProductoEstadoStockEntity> entities = this.read(specs);

        return entities.stream().map(entity -> {
            ProductoEstadoStockResponseDTO dto = new ProductoEstadoStockResponseDTO();
            dto.setIdProductoEstadoStock(entity.getIdProductoEstadoStock());

            if (entity.getProducto() != null) {
                dto.setIdProducto(entity.getProducto().getIdProducto());
                dto.setNombreProducto(entity.getProducto().getNombreProducto());
            }

            if (entity.getEstadoStock() != null) {
                dto.setIdEstadoStock(entity.getEstadoStock().getIdEstadoStock());
                dto.setNombreEstado(entity.getEstadoStock().getNombreEstado());
            }

            dto.setMinimo(entity.getMinimo());
            dto.setMaximo(entity.getMaximo());

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void configurarUmbrales(com.galtekone.dto.productoEstadoStock.ConfigurarUmbralesDTO dto, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // 1. Validate product
        ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                dto.getIdProducto(),
                empresaId,
                "Producto",
                productosRepository::findByIdProductoAndEmpresa_IdEmpresa);

        // 2. Fetch all states for the company
        List<EstadoStockEntity> estados = estadoStockRepository.findByEmpresa_IdEmpresaOrderByOrdenAsc(empresaId);
        
        // Ensure we have exactly 4 states (Agotado, Critico, Bajo, Optimo)
        if (estados.size() != 4) {
            throw new RuntimeException("Debe existir la configuración básica de 4 estados de stock para usar este endpoint.");
        }

        // 3. Validate math
        int critico = dto.getCritico();
        int bajo = dto.getBajo();

        if (critico <= 0) throw new RuntimeException("El umbral crítico debe ser mayor a 0");
        if (bajo < critico) throw new RuntimeException("El umbral bajo no puede ser menor al crítico");

        // 4. Delete previous rules
        List<ProductoEstadoStockEntity> existing = repository.findByProducto_IdProductoAndEmpresa_IdEmpresa(dto.getIdProducto(), empresaId);
        repository.deleteAll(existing);
        repository.flush(); // Force execute DELETE in DB before inserting the new ones to avoid duplicate entry violation

        com.galtekone.entity.EmpresasEntity empresa = new com.galtekone.entity.EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        // 5. Create new rules
        // Orden 1: Agotado
        crearRegla(producto, estados.get(0), 0, 0, user, empresa);
        // Orden 2: Critico
        crearRegla(producto, estados.get(1), 1, critico, user, empresa);
        // Orden 3: Bajo
        crearRegla(producto, estados.get(2), critico + 1, bajo, user, empresa);
        // Orden 4: Optimo
        crearRegla(producto, estados.get(3), bajo + 1, 999999, user, empresa);
    }

    private void crearRegla(ProductosEntity prod, EstadoStockEntity estado, int min, int max, String user, com.galtekone.entity.EmpresasEntity empresa) {
        ProductoEstadoStockEntity regla = new ProductoEstadoStockEntity();
        regla.setProducto(prod);
        regla.setEstadoStock(estado);
        regla.setMinimo(new BigDecimal(min));
        regla.setMaximo(new BigDecimal(max));
        regla.setUsuarioCreacion(user);
        regla.setEmpresa(empresa);

        repository.save(regla);
    }
}
