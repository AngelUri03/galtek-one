package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.reporte.ReporteGananciaDTO;
import com.galtekone.entity.DevolucionesEntity;
import com.galtekone.entity.HistorialCostosEntity;
import com.galtekone.entity.VentaDetalleEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.DevolucionesRepository;
import com.galtekone.repository.HistorialCostosRepository;
import com.galtekone.repository.VentaDetalleRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.ReporteFinancieroService;

@Service
public class ReporteFinancieroServiceImpl implements ReporteFinancieroService {

    @Autowired
    private VentasRepository ventasRepository;

    @Autowired
    private VentaDetalleRepository ventaDetalleRepository;

    @Autowired
    private HistorialCostosRepository historialCostosRepository;

    @Autowired
    private DevolucionesRepository devolucionesRepository;

    @Override
    public ReporteGananciaDTO getReporteGanancia(LocalDateTime desde, LocalDateTime hasta) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // SQLite guarda timestamps como texto; filtrar el rango en Java evita
        // comparaciones inconsistentes entre parametros JDBC y columnas TEXT.
        Specification<VentasEntity> ventasSpec = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);
        List<VentasEntity> ventas = ventasRepository.findAll(ventasSpec).stream()
                .filter(v -> isBetween(v.getFechaCreacion(), desde, hasta))
                .toList();

        // 2. Venta Bruta = suma de totales de ventas
        BigDecimal ventaBruta = ventas.stream()
                .map(v -> BigDecimal.valueOf(v.getTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Specification<VentaDetalleEntity> detallesSpec = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);
        List<VentaDetalleEntity> detalles = ventaDetalleRepository.findAll(detallesSpec).stream()
                .filter(d -> d.getVenta() != null && isBetween(d.getVenta().getFechaCreacion(), desde, hasta))
                .toList();
        List<HistorialCostosEntity> historiales = historialCostosRepository
                .findAll((root, query, cb) -> cb.equal(root.get("empresa").get("idEmpresa"), empresaId));

        // 4. Calcular costo historico por producto y agregar por producto
        Map<Integer, ReporteGananciaDTO.DetalleGananciaProductoDTO> productosMap = new LinkedHashMap<>();
        BigDecimal costoTotal = BigDecimal.ZERO;

        for (VentaDetalleEntity detalle : detalles) {
            Integer idProducto = detalle.getProducto().getIdProducto();
            String nombreProducto = detalle.getProducto().getNombreProducto();
            LocalDateTime fechaVenta = detalle.getVenta().getFechaCreacion();

            // Buscar costo historico mas reciente antes de la fecha de venta
            Optional<HistorialCostosEntity> historial = historiales.stream()
                    .filter(h -> h.getProducto() != null
                            && idProducto.equals(h.getProducto().getIdProducto())
                            && h.getFechaCreacion() != null
                            && fechaVenta != null
                            && !h.getFechaCreacion().isAfter(fechaVenta))
                    .max(Comparator.comparing(HistorialCostosEntity::getFechaCreacion));

            BigDecimal costoUnitario = historial
                .map(HistorialCostosEntity::getCostoNuevo)
                .orElse(BigDecimal.ZERO);

            BigDecimal costoLinea = costoUnitario.multiply(detalle.getCantidad());
            BigDecimal ingresoLinea = BigDecimal.valueOf(detalle.getSubtotal());
            costoTotal = costoTotal.add(costoLinea);

            // Agregar al mapa de productos
            ReporteGananciaDTO.DetalleGananciaProductoDTO prod = productosMap.get(idProducto);
            if (prod == null) {
                prod = new ReporteGananciaDTO.DetalleGananciaProductoDTO();
                prod.setIdProducto(idProducto);
                prod.setNombreProducto(nombreProducto);
                prod.setCantidadVendida(BigDecimal.ZERO);
                prod.setIngresoVenta(BigDecimal.ZERO);
                prod.setCostoHistorico(BigDecimal.ZERO);
                prod.setGanancia(BigDecimal.ZERO);
                productosMap.put(idProducto, prod);
            }

            prod.setCantidadVendida(prod.getCantidadVendida().add(detalle.getCantidad()).setScale(2, RoundingMode.HALF_UP));
            prod.setIngresoVenta(prod.getIngresoVenta().add(ingresoLinea).setScale(2, RoundingMode.HALF_UP));
            prod.setCostoHistorico(prod.getCostoHistorico().add(costoLinea).setScale(2, RoundingMode.HALF_UP));
            prod.setGanancia(prod.getIngresoVenta().subtract(prod.getCostoHistorico()).setScale(2, RoundingMode.HALF_UP));

            if (prod.getIngresoVenta().compareTo(BigDecimal.ZERO) > 0) {
                prod.setMargenPorcentaje(
                        prod.getGanancia()
                                .divide(prod.getIngresoVenta(), 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .setScale(2, RoundingMode.HALF_UP));
            } else {
                prod.setMargenPorcentaje(BigDecimal.ZERO);
            }
        }

        // 5. Devoluciones del rango
        Specification<DevolucionesEntity> devSpec = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);
        BigDecimal totalDevoluciones = devolucionesRepository.findAll(devSpec).stream()
                .filter(d -> isBetween(d.getFechaCreacion(), desde, hasta))
                .map(DevolucionesEntity::getTotalDevolucion)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 6. Calcular totales
        BigDecimal ventaNetaAjustada = ventaBruta.subtract(totalDevoluciones);
        BigDecimal gananciaNeta = ventaNetaAjustada.subtract(costoTotal);

        BigDecimal margenPorcentaje = BigDecimal.ZERO;
        if (ventaNetaAjustada.compareTo(BigDecimal.ZERO) > 0) {
            margenPorcentaje = gananciaNeta
                    .divide(ventaNetaAjustada, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // 7. Construir respuesta
        ReporteGananciaDTO dto = new ReporteGananciaDTO();
        dto.setVentaBruta(ventaBruta.setScale(2, RoundingMode.HALF_UP));
        dto.setCostoTotal(costoTotal.setScale(2, RoundingMode.HALF_UP));
        dto.setGananciaNeta(gananciaNeta.setScale(2, RoundingMode.HALF_UP));
        dto.setMargenPorcentaje(margenPorcentaje.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalDevoluciones(totalDevoluciones.setScale(2, RoundingMode.HALF_UP));
        dto.setVentaNetaAjustada(ventaNetaAjustada.setScale(2, RoundingMode.HALF_UP));
        dto.setDesde(desde);
        dto.setHasta(hasta);
        dto.setDetallesPorProducto(new ArrayList<>(productosMap.values()));

        return dto;
    }

    private boolean isBetween(LocalDateTime value, LocalDateTime desde, LocalDateTime hasta) {
        return value != null && !value.isBefore(desde) && !value.isAfter(hasta);
    }
}

