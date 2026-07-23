package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.galtekone.dto.cliente.ClienteDTO;
import com.galtekone.dto.venta.CreateVentaRequest;
import com.galtekone.dto.venta.ItemTicketDTO;
import com.galtekone.dto.venta.ItemVentaRequest;
import com.galtekone.dto.venta.TicketVentaResponse;
import com.galtekone.entity.*;
import com.galtekone.repository.*;
import com.galtekone.services.CajaOperacionGuard;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.LotesService;
import com.galtekone.services.VentaDetalleService;
import com.galtekone.utils.EmpresaValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.services.VentasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class VentasServiceImpl implements VentasService {

    @Autowired
    private VentasRepository ventasRepository;

    @Autowired
    private EmpresaValidator empresaValidator;
    @Autowired
    private UsuariosRepository usuariosRepository;
    @Autowired
    private ClientesRepository clientesRepository;
    @Autowired
    private MetodoPagoRepository metodosPagoRepository;
    @Autowired
    private CajasRepository cajasRepository;
    @Autowired
    private VentaDetalleRepository ventaDetalleRepository;
    @Autowired
    private VentaDetalleService ventaDetalleService;
    @Autowired
    private LotesService lotesService; // Injected
    @Autowired
    private ProductosRepository productosRepository;
    @Autowired
    private CajaOperacionGuard cajaOperacionGuard;
    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;
    @Autowired
    private CajaSesionRepository cajaSesionRepository;
    @Autowired
    private CajaSaldoService cajaSaldoService;

    private static final BigDecimal TAX_RATE = new BigDecimal("0.16");

    @Transactional
    @Override
    public VentasEntity create(VentasEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);
        return ventasRepository.save(obj);
    }

    @Override
    public List<VentasEntity> read(Specification<VentasEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<VentasEntity> filtroEmpresa = (root, query, cb) -> cb.equal(root.get("empresa").get("idEmpresa"),
                empresaId);
        Specification<VentasEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return ventasRepository.findAll(finalSpec);
    }

    @Override
    @Transactional
    public VentasEntity update(VentasEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar que la venta pertenezca a la empresa actual
        VentasEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdVenta(),
                empresaId,
                "Venta",
                ventasRepository::findByIdVentaAndEmpresa_IdEmpresa);
        // Actualizar campos condicionalmente
        if (obj.getCliente() != null) {
            ClientesEntity cliente = empresaValidator.validarEntidadPorEmpresa(
                    obj.getCliente().getIdCliente(),
                    empresaId,
                    "Cliente",
                    clientesRepository::findByIdClienteAndEmpresa_IdEmpresa);
            entityToUpdate.setCliente(cliente);
        }
        if (obj.getMetodoPago() != null) {
            MetodoPagoEntity metodoPago = empresaValidator.validarEntidadPorEmpresa(
                    obj.getMetodoPago().getIdMetodoPago(),
                    empresaId,
                    "Método de Pago",
                    metodosPagoRepository::findByIdMetodoPagoAndEmpresa_IdEmpresa);
            entityToUpdate.setMetodoPago(metodoPago);
        }
        if (obj.getCaja() != null) {
            CajasEntity caja = empresaValidator.validarEntidadPorEmpresa(
                    obj.getCaja().getIdCaja(),
                    empresaId,
                    "Caja",
                    cajasRepository::findByIdCajaAndEmpresa_IdEmpresa);
            entityToUpdate.setCaja(caja);
        }
        if (obj.getTotal() != null) {
            entityToUpdate.setTotal(obj.getTotal());
        }
        if (obj.getEstado() != null) {
            entityToUpdate.setEstado(obj.getEstado());
        }
        entityToUpdate.setUsuarioModificacion(user);

        return ventasRepository.save(entityToUpdate);
    }

    @Override
    public VentasEntity delete(Integer idVenta, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Optional<VentasEntity> optional = ventasRepository.findById(idVenta);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Venta no encontrada o no pertenece a tu empresa");
        }

        VentasEntity entity = optional.get();
        entity.setUsuarioModificacion(user);
        ventasRepository.deleteById(idVenta);

        return entity;
    }

    @Transactional
    @Override
    public TicketVentaResponse generarVenta(CreateVentaRequest request, String user) {

        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        CajaSesionEntity cajaSesion = cajaOperacionGuard.requireOpenSessionForSale(user, request.getCajaId());

        ClientesEntity cliente = null;
        if (request.getClienteId() != null) {
            cliente = empresaValidator.validarEntidadPorEmpresa(
                    request.getClienteId(),
                    empresaId,
                    "Cliente",
                    clientesRepository::findByIdClienteAndEmpresa_IdEmpresa);
        }

        MetodoPagoEntity metodoPago = empresaValidator.validarEntidadPorEmpresa(
                request.getMetodoPagoId(),
                empresaId,
                "Método de Pago",
                metodosPagoRepository::findByIdMetodoPagoAndEmpresa_IdEmpresa);

        UsuariosEntity usuario = usuariosRepository
                .findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<ItemTicketDTO> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (ItemVentaRequest p : request.getProductos()) {

            ProductosEntity producto = empresaValidator.validarEntidadPorEmpresa(
                    p.getProductoId(),
                    empresaId,
                    "Producto",
                    productosRepository::findByIdProductoAndEmpresa_IdEmpresa);

            BigDecimal cantidad = getBigDecimal(p, producto);

            BigDecimal precioUnitario = BigDecimal
                    .valueOf(producto.getPrecioVenta())
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal importe = precioUnitario
                    .multiply(cantidad)
                    .setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(importe);

            ItemTicketDTO item = new ItemTicketDTO();
            item.setIdProducto(producto.getIdProducto());
            item.setNombreProducto(producto.getNombreProducto());
            item.setCantidad(cantidad);
            item.setPrecioUnitario(precioUnitario);
            item.setImporte(importe);

            items.add(item);
        }

        BigDecimal iva = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(iva).setScale(2, RoundingMode.HALF_UP);

        VentasEntity venta = new VentasEntity();
        venta.setCliente(cliente);
        venta.setMetodoPago(metodoPago);
        venta.setCajaSesion(cajaSesion);
        venta.setEstado("COMPLETADA");
        venta.setTotal(total.floatValue());
        venta.setUsuario(usuario);

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        venta.setEmpresa(empresa);

        VentasEntity ventaGuardada = this.create(venta, user);

        for (ItemTicketDTO it : items) {

            ProductosEntity producto = productosRepository.findById(it.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            VentaDetalleEntity detalle = new VentaDetalleEntity();
            detalle.setVenta(ventaGuardada);
            detalle.setProducto(producto);
            detalle.setCantidad(it.getCantidad()); // Direct assign BigDecimal
            detalle.setPrecioUnitario(it.getPrecioUnitario().floatValue());
            detalle.setSubtotal(it.getImporte().floatValue());
            detalle.setUsuarioCreacion(user);

            EmpresasEntity empDetalle = new EmpresasEntity();
            empDetalle.setIdEmpresa(empresaId);
            detalle.setEmpresa(empDetalle);

            ventaDetalleRepository.save(detalle);

            try {
                // Note: VentasServiceImpl (this) injects LotesService to handle stock logic.
                lotesService.descontarConsumo(
                        it.getIdProducto(),
                        request.getAlmacenId(),
                        it.getCantidad(),
                        user);
            } catch (Exception e) {

                throw new RuntimeException("Error al descontar stock de lotes: " + e.getMessage(), e);
            }
        }

        registerCashImpactIfNeeded(cajaSesion, ventaGuardada, metodoPago, usuario, total, user);

        TicketVentaResponse ticket = new TicketVentaResponse();
        ticket.setIdVenta(ventaGuardada.getIdVenta());
        ticket.setFolio("F-" + ventaGuardada.getIdVenta());
        ticket.setFecha(ventaGuardada.getFechaCreacion());

        if (cliente != null) {
            ClienteDTO c = new ClienteDTO();
            c.setIdCliente(cliente.getIdCliente());
            c.setNombre(cliente.getNombre());
            c.setTelefono(cliente.getTelefono());
            ticket.setCliente(c);
        }
        ticket.setItems(items);
        ticket.setSubtotal(subtotal);
        ticket.setIVA(iva);
        ticket.setTotal(total);
        ticket.setMetodoPago(metodoPago.getNombreMetodoPago());
        ticket.setUsuarioAtendio(user);
        ticket.setMensaje("Venta generada correctamente.");

        return ticket;
    }

    private static BigDecimal getBigDecimal(ItemVentaRequest p, ProductosEntity producto) {
        BigDecimal cantidad = p.getCantidad();

        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cantidad inválida para " + producto.getNombreProducto());
        }

        if (!producto.getEsPesaje()) {
            if (cantidad.stripTrailingZeros().scale() > 0) {
                throw new RuntimeException(
                        "El producto " + producto.getNombreProducto() + " no permite decimales");
            }
        }
        return cantidad;
    }

    private void registerCashImpactIfNeeded(CajaSesionEntity cajaSesion, VentasEntity venta,
            MetodoPagoEntity metodoPago, UsuariosEntity usuario, BigDecimal total, String user) {
        LocalDateTime now = LocalDateTime.now();
        EmpresasEntity empresa = venta.getEmpresa();

        if (isCashPayment(metodoPago)) {
            cajaSaldoService.registrarMovimientoContinuo(
                    cajaSesion.getLocalDevice(),
                    cajaSesion,
                    usuario,
                    MovimientoCajaTipo.CASH_SALE,
                    "IN",
                    total.setScale(2, RoundingMode.HALF_UP),
                    "SALE_CASH",
                    "Venta en efectivo",
                    "SALE",
                    String.valueOf(venta.getIdVenta()),
                    "cash-sale-" + venta.getIdVenta(),
                    user);
        }

        cajaSesion.setLastActivityAt(now);
        cajaSesion.setUsuarioModificacion(user);
        cajaSesionRepository.save(cajaSesion);
    }

    private boolean isCashPayment(MetodoPagoEntity metodoPago) {
        String name = metodoPago == null || metodoPago.getNombreMetodoPago() == null
                ? ""
                : metodoPago.getNombreMetodoPago().trim().toLowerCase(Locale.ROOT);
        return name.contains("efectivo");
    }

}
