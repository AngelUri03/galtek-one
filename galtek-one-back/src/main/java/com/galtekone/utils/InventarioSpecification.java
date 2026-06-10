package com.galtekone.utils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.inventario.InventarioFilterDTO;
import com.galtekone.entity.EstadoStockEntity;
import com.galtekone.entity.InventarioEntity;
import com.galtekone.entity.LotesEntity;
import com.galtekone.entity.ProductoEstadoStockEntity;
import com.galtekone.entity.ProductosEntity;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public class InventarioSpecification {

    public static Specification<InventarioEntity> filter(InventarioFilterDTO filter) {
        return (root, query, cb) -> {
            Integer empresaId = EmpresaContextHolder.getEmpresaId();
            List<Predicate> predicates = new ArrayList<>();
            if (empresaId == null) {
                throw new IllegalStateException("Empresa no resuelta para la sesiÃ³n actual");
            }

            // 1. Filtro Obligatorio: Empresa
            predicates.add(cb.equal(root.get("empresa").get("idEmpresa"), empresaId));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // 2. Filtros Simples (Joins directos)
            if (filter.getCategoriaIds() != null && !filter.getCategoriaIds().isEmpty()) {
                Join<InventarioEntity, ProductosEntity> prod = root.join("producto", JoinType.INNER);
                predicates.add(prod.get("categoria").get("idCategoria").in(filter.getCategoriaIds()));
            }

            if (filter.getAlmacenIds() != null && !filter.getAlmacenIds().isEmpty()) {
                predicates.add(root.get("almacen").get("idAlmacen").in(filter.getAlmacenIds()));
            }

            if (filter.getActivo() != null) {
                predicates.add(cb.equal(root.get("producto").get("estatus"), filter.getActivo()));
            }

            if (filter.getStockMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("existencia"), filter.getStockMin()));
            }

            if (filter.getStockMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("existencia"), filter.getStockMax()));
            }

            if (filter.getActualizadoDesde() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaUltimaCompra"), filter.getActualizadoDesde()));
            }
            if (filter.getActualizadoHasta() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaUltimaCompra"), filter.getActualizadoHasta()));
            }

            // 3. Filtro Proveedor (Join Navigable)
            if (filter.getProveedorIds() != null && !filter.getProveedorIds().isEmpty()) {
                // Requiere distinct porque es 1:N
                query.distinct(true);
                predicates.add(root.join("producto")
                        .join("proveedores")
                        .get("proveedor")
                        .get("idProveedor")
                        .in(filter.getProveedorIds()));
            }

            // 4. Estado de Stock (Join Complejo con Reglas)
            if (filter.getEstadoStock() != null && !filter.getEstadoStock().isEmpty()) {
                // Join a Producto -> Reglas
                query.distinct(true);
                Join<ProductosEntity, ProductoEstadoStockEntity> reglas = root.join("producto").join("reglasStock",
                        JoinType.INNER);
                Join<ProductoEstadoStockEntity, EstadoStockEntity> estado = reglas.join("estadoStock", JoinType.INNER);

                // Condicion: Existencia BETWEEN Min AND Max
                Predicate rangoValido = cb.between(root.get("existencia"), reglas.get("minimo"), reglas.get("maximo"));

                // Condicion: Nombre Estado coincide
                Predicate nombreEstado = cb.equal(estado.get("nombreEstado"), filter.getEstadoStock());

                // Además validar que la regla es de la misma empresa (redundante si la relación
                // está bien pero seguro)
                Predicate empresaRegla = cb.equal(reglas.get("empresa").get("idEmpresa"), empresaId);

                predicates.add(cb.and(rangoValido, nombreEstado, empresaRegla));
            }

            // 5. Filtros Lotes (Subqueries)
            if (Boolean.TRUE.equals(filter.getTieneLotesCaducados()) || (filter.getCaducaEnDias() != null)) {

                Subquery<Long> subLote = query.subquery(Long.class);
                Root<LotesEntity> loteRoot = subLote.from(LotesEntity.class);
                subLote.select(cb.literal(1L));

                List<Predicate> lotePreds = new ArrayList<>();
                // Vincular lote con inventario (Mismo producto y almacen)
                lotePreds.add(cb.equal(loteRoot.get("producto"), root.get("producto")));
                lotePreds.add(cb.equal(loteRoot.get("almacen"), root.get("almacen")));
                lotePreds.add(cb.greaterThan(loteRoot.get("cantidad"), java.math.BigDecimal.ZERO)); // Solo lotes con
                                                                                                    // stock

                LocalDate today = LocalDate.now();

                if (Boolean.TRUE.equals(filter.getTieneLotesCaducados())) {
                    lotePreds.add(cb.lessThan(loteRoot.get("fechaCaducidad"), today));
                }

                if (filter.getCaducaEnDias() != null) {
                    LocalDate limitDate = today.plusDays(filter.getCaducaEnDias());
                    // Caduca entre hoy y el limite (o ya expiró si no filtramos expirados)
                    lotePreds.add(cb.lessThanOrEqualTo(loteRoot.get("fechaCaducidad"), limitDate));
                }

                // Filtro por ID lote o Numero si existe
                if (filter.getNumeroLote() != null && !filter.getNumeroLote().isEmpty()) {
                    // Asumimos que numeroLote es ID por ahora, parsear integer
                    try {
                        Integer loteId = Integer.parseInt(filter.getNumeroLote());
                        lotePreds.add(cb.equal(loteRoot.get("idLote"), loteId));
                    } catch (NumberFormatException e) {
                        // Si no es numero, ignorar o fallar. Ignoramos para robustez.
                    }
                }

                subLote.where(lotePreds.toArray(new Predicate[0]));
                predicates.add(cb.exists(subLote));
            } else if (filter.getNumeroLote() != null && !filter.getNumeroLote().isEmpty()) {
                // Filtro solo por lote ID sin caducidad
                Subquery<Long> subLote = query.subquery(Long.class);
                Root<LotesEntity> loteRoot = subLote.from(LotesEntity.class);
                subLote.select(cb.literal(1L));

                List<Predicate> lotePreds = new ArrayList<>();
                lotePreds.add(cb.equal(loteRoot.get("producto"), root.get("producto")));
                lotePreds.add(cb.equal(loteRoot.get("almacen"), root.get("almacen")));

                try {
                    Integer loteId = Integer.parseInt(filter.getNumeroLote());
                    lotePreds.add(cb.equal(loteRoot.get("idLote"), loteId));
                } catch (NumberFormatException e) {
                    lotePreds.add(cb.disjunction()); // Force false if invalid ID
                }
                subLote.where(lotePreds.toArray(new Predicate[0]));
                predicates.add(cb.exists(subLote));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
