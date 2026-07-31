package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.galtekone.dto.cliente.ClienteDTO;
import com.galtekone.dto.pagos.TerminalPagoConfigDTO;
import com.galtekone.dto.venta.CreateVentaRequest;
import com.galtekone.dto.venta.ItemTicketDTO;
import com.galtekone.dto.venta.ItemVentaRequest;
import com.galtekone.dto.venta.TicketVentaResponse;
import com.galtekone.entity.*;
import com.galtekone.repository.*;
import com.galtekone.services.CajaOperacionGuard;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.ConfiguracionPagosService;
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
    @Autowired
    private ConfiguracionPagosService configuracionPagosService;

    private static final BigDecimal ZERO_MONEY = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal HALF_PESO_FACTOR = new BigDecimal("2");
    private static final BigDecimal PAYMENT_TOLERANCE = new BigDecimal("0.01");

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
        if (request == null || request.getProductos() == null || request.getProductos().isEmpty()) {
            throw new IllegalArgumentException("La venta debe contener al menos un producto.");
        }

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
        ConfiguracionPagosEntity configuracionPagos = configuracionPagosService.getOrCreate(empresaId, user);
        validatePaymentMethodAllowed(metodoPago, configuracionPagos);

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

        BigDecimal iva = ZERO_MONEY;
        PaymentResolution payment = resolvePayment(request, metodoPago, configuracionPagos, subtotal);

        VentasEntity venta = new VentasEntity();
        venta.setCliente(cliente);
        venta.setMetodoPago(metodoPago);
        venta.setCajaSesion(cajaSesion);
        venta.setEstado("COMPLETADA");
        venta.setTotal(payment.totalCobrado().floatValue());
        venta.setTotalOriginal(payment.totalOriginal());
        venta.setTotalCobrado(payment.totalCobrado());
        venta.setRedondeoAplicado(payment.redondeoAplicado());
        venta.setComisionPago(payment.comisionMonto());
        venta.setComisionPorcentaje(payment.comisionPorcentaje());
        venta.setRecibido(payment.recibido());
        venta.setCambio(payment.cambio());
        venta.setReferenciaPago(payment.referencia());
        venta.setFolioPago(payment.folio());
        venta.setPagoVerificado(payment.pagoVerificado());
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

                throw new IllegalArgumentException("No se pudo descontar stock de lotes: " + e.getMessage(), e);
            }
        }

        registerPaymentImpact(cajaSesion, ventaGuardada, metodoPago, usuario, payment.totalCobrado(), user);

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
        ticket.setTotal(payment.totalCobrado());
        ticket.setTotalOriginal(payment.totalOriginal());
        ticket.setTotalCobrado(payment.totalCobrado());
        ticket.setRedondeoAplicado(payment.redondeoAplicado());
        ticket.setComisionMonto(payment.comisionMonto());
        ticket.setComisionPorcentaje(payment.comisionPorcentaje());
        ticket.setRecibido(payment.recibido());
        ticket.setCambio(payment.cambio());
        ticket.setReferencia(payment.referencia());
        ticket.setFolioPago(payment.folio());
        ticket.setPagoVerificado(payment.pagoVerificado());
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

    private PaymentResolution resolvePayment(CreateVentaRequest request, MetodoPagoEntity metodoPago,
            ConfiguracionPagosEntity configuracionPagos, BigDecimal subtotal) {
        BigDecimal totalOriginal = scaleMoney(subtotal);
        assertOptionalMatches(request.getTotalOriginal(), totalOriginal,
                "El total de pantalla no coincide con los precios actuales.");

        boolean cash = isCashPayment(metodoPago);
        boolean terminal = isTerminalPayment(metodoPago);
        boolean transfer = isTransferPayment(metodoPago);
        TerminalPagoConfigDTO terminalConfig = terminal
                ? configuracionPagosService.resolveTerminal(configuracionPagos, request.getTerminalKey())
                : null;
        BigDecimal redondeo = cash && Boolean.TRUE.equals(request.getRedondeoActivo())
                ? roundUpToHalf(totalOriginal).subtract(totalOriginal)
                : ZERO_MONEY;
        redondeo = scaleMoney(redondeo);
        assertOptionalMatches(request.getRedondeoAplicado(), redondeo,
                "El redondeo enviado no coincide con el calculo de caja.");

        BigDecimal commissionPercent = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        BigDecimal commissionAmount = ZERO_MONEY;
        if (terminal) {
            boolean commissionEnabled = terminalConfig == null
                    ? Boolean.TRUE.equals(configuracionPagos.getTerminalCommissionEnabled())
                    : Boolean.TRUE.equals(terminalConfig.getCommissionEnabled());
            BigDecimal configuredPercent = terminalConfig != null && terminalConfig.getCommissionPercent() != null
                    ? terminalConfig.getCommissionPercent()
                    : configuracionPagos.getTerminalCommissionPercent();
            commissionPercent = commissionEnabled
                    ? normalizePercent(configuredPercent)
                    : BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            assertOptionalPercentMatches(request.getComisionPorcentaje(), commissionPercent,
                    "La comision de terminal no coincide con la configuracion de pagos.");
            if (commissionPercent.signum() > 0) {
                commissionAmount = scaleMoney(totalOriginal.multiply(commissionPercent)
                        .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
                assertOptionalMatches(request.getComisionMonto(), commissionAmount,
                        "La comision de terminal no coincide con el porcentaje configurado.");
            } else {
                commissionAmount = request.getComisionMonto() == null
                        ? ZERO_MONEY
                        : normalizeNonNegativeMoney(request.getComisionMonto(), "La comision no puede ser negativa.");
                if (commissionAmount.signum() > 0) {
                    throw new IllegalArgumentException("La terminal no tiene comision configurada para cobrar.");
                }
            }
        }

        if (!terminal && request.getComisionMonto() != null
                && normalizeNonNegativeMoney(request.getComisionMonto(), "La comision no puede ser negativa.").signum() > 0) {
            throw new IllegalArgumentException("Solo las ventas por terminal pueden aplicar comision de pago.");
        }

        BigDecimal totalCobrado = scaleMoney(totalOriginal.add(redondeo).add(commissionAmount));
        assertOptionalMatches(request.getTotalCobrado(), totalCobrado,
                "El total cobrado no coincide con los ajustes permitidos.");

        BigDecimal recibido = null;
        BigDecimal cambio = ZERO_MONEY;
        if (cash) {
            recibido = normalizeNonNegativeMoney(request.getRecibido(),
                    "El efectivo recibido es requerido y no puede ser negativo.");
            if (recibido.compareTo(totalCobrado) < 0) {
                throw new IllegalArgumentException("El efectivo recibido no cubre el total de la venta.");
            }
            cambio = scaleMoney(recibido.subtract(totalCobrado));
            assertOptionalMatches(request.getCambio(), cambio,
                    "El cambio enviado no coincide con el efectivo recibido.");
        }

        String referencia = trimToNull(request.getReferencia(), 120, "La referencia de pago no puede superar 120 caracteres.");
        String folio = trimToNull(request.getFolio(), 120, "El folio de pago no puede superar 120 caracteres.");
        boolean pagoVerificado = Boolean.TRUE.equals(request.getPagoVerificado());

        if (terminal) {
            if (Boolean.TRUE.equals(configuracionPagos.getTerminalRequireReference()) && referencia == null) {
                throw new IllegalArgumentException("La venta por terminal requiere referencia o autorizacion.");
            }
            if (!pagoVerificado) {
                throw new IllegalArgumentException("Confirma que el pago fue aprobado en terminal.");
            }
        }

        if (transfer) {
            if (folio == null && referencia == null) {
                throw new IllegalArgumentException("La transferencia requiere folio, clave de rastreo o referencia.");
            }
            if (!pagoVerificado) {
                throw new IllegalArgumentException("Confirma que la transferencia fue verificada en cuenta.");
            }
            if (folio == null) {
                folio = referencia;
            }
        }

        if (!terminal && !transfer && Boolean.TRUE.equals(metodoPago.getRequiereReferencia())
                && referencia == null && folio == null) {
            throw new IllegalArgumentException("El metodo de pago requiere referencia para cerrar la venta.");
        }
        if (!terminal && !transfer && Boolean.TRUE.equals(metodoPago.getRequiereVerificacion())
                && !pagoVerificado) {
            throw new IllegalArgumentException("Confirma que el pago fue verificado antes de cerrar la venta.");
        }

        return new PaymentResolution(
                totalOriginal,
                totalCobrado,
                redondeo,
                commissionAmount,
                commissionPercent,
                recibido,
                cambio,
                referencia,
                folio,
                pagoVerificado);
    }

    private void registerPaymentImpact(CajaSesionEntity cajaSesion, VentasEntity venta,
            MetodoPagoEntity metodoPago, UsuariosEntity usuario, BigDecimal total, String user) {
        LocalDateTime now = LocalDateTime.now();

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
        } else {
            boolean transfer = isTransferPayment(metodoPago);
            boolean terminal = isTerminalPayment(metodoPago);
            boolean card = isCardPayment(metodoPago);
            boolean voucher = "VOUCHER".equals(normalizePaymentType(metodoPago));
            String category = transfer ? "SALE_TRANSFER" : terminal ? "SALE_TERMINAL" : card ? "SALE_CARD" : "SALE_ELECTRONIC";
            String reason = transfer ? "Venta por transferencia" : terminal
                    ? "Venta por terminal"
                    : card
                            ? "Venta por tarjeta"
                            : voucher ? "Venta con vales" : "Venta con pago electronico";
            cajaSaldoService.registrarMovimientoContinuo(
                    cajaSesion.getLocalDevice(),
                    cajaSesion,
                    usuario,
                    MovimientoCajaTipo.CARD_ENTRY,
                    "IN",
                    total.setScale(2, RoundingMode.HALF_UP),
                    category,
                    reason,
                    "SALE",
                    String.valueOf(venta.getIdVenta()),
                    "electronic-sale-" + venta.getIdVenta(),
                    user);
        }

        cajaSesion.setLastActivityAt(now);
        cajaSesion.setUsuarioModificacion(user);
        cajaSesionRepository.save(cajaSesion);
    }

    private boolean isCashPayment(MetodoPagoEntity metodoPago) {
        return "CASH".equals(normalizePaymentType(metodoPago)) || normalizePaymentName(metodoPago).contains("efectivo");
    }

    private boolean isTerminalPayment(MetodoPagoEntity metodoPago) {
        if ("TERMINAL".equals(normalizePaymentType(metodoPago))) {
            return true;
        }
        String name = normalizePaymentName(metodoPago);
        return name.contains("mercado pago") || name.contains("terminal");
    }

    private boolean isCardPayment(MetodoPagoEntity metodoPago) {
        if ("CARD".equals(normalizePaymentType(metodoPago))) {
            return true;
        }
        String name = normalizePaymentName(metodoPago);
        return name.contains("tarjeta") || name.contains("credito") || name.contains("debito");
    }

    private boolean isTransferPayment(MetodoPagoEntity metodoPago) {
        if ("TRANSFER".equals(normalizePaymentType(metodoPago))) {
            return true;
        }
        String name = normalizePaymentName(metodoPago);
        return name.contains("transfer") || name.contains("spei");
    }

    private void validatePaymentMethodAllowed(MetodoPagoEntity metodoPago, ConfiguracionPagosEntity configuracionPagos) {
        if (metodoPago == null || !Boolean.TRUE.equals(metodoPago.getEstatus())
                || Boolean.FALSE.equals(metodoPago.getVisiblePos())) {
            throw new IllegalArgumentException("El metodo de pago seleccionado no esta activo en POS.");
        }
        if (isTerminalPayment(metodoPago) && !Boolean.TRUE.equals(configuracionPagos.getTerminalEnabled())) {
            throw new IllegalArgumentException("La terminal esta desactivada en configuracion de pagos.");
        }
        if (isTerminalPayment(metodoPago) && configuracionPagosService.getTerminales(configuracionPagos).stream()
                .noneMatch(terminal -> terminal.getEnabled() == null || Boolean.TRUE.equals(terminal.getEnabled()))) {
            throw new IllegalArgumentException("No hay terminales activas para cobrar por terminal.");
        }
    }

    private String normalizePaymentType(MetodoPagoEntity metodoPago) {
        return metodoPago == null || metodoPago.getTipo() == null
                ? ""
                : metodoPago.getTipo().trim().toUpperCase(Locale.ROOT);
    }

    private String normalizePaymentName(MetodoPagoEntity metodoPago) {
        return metodoPago == null || metodoPago.getNombreMetodoPago() == null
                ? ""
                : metodoPago.getNombreMetodoPago().trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal roundUpToHalf(BigDecimal value) {
        return value.multiply(HALF_PESO_FACTOR)
                .setScale(0, RoundingMode.CEILING)
                .divide(HALF_PESO_FACTOR, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeNonNegativeMoney(BigDecimal value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        BigDecimal normalized = scaleMoney(value);
        if (normalized.signum() < 0) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private BigDecimal normalizePercent(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }
        if (value.signum() < 0 || value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("El porcentaje de comision debe estar entre 0 y 100.");
        }
        return value.setScale(4, RoundingMode.HALF_UP);
    }

    private void assertOptionalMatches(BigDecimal provided, BigDecimal expected, String message) {
        if (provided == null) {
            return;
        }
        BigDecimal normalized = scaleMoney(provided);
        if (normalized.subtract(scaleMoney(expected)).abs().compareTo(PAYMENT_TOLERANCE) > 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private void assertOptionalPercentMatches(BigDecimal provided, BigDecimal expected, String message) {
        if (provided == null) {
            return;
        }
        BigDecimal normalized = provided.setScale(4, RoundingMode.HALF_UP);
        BigDecimal normalizedExpected = (expected == null ? BigDecimal.ZERO : expected).setScale(4, RoundingMode.HALF_UP);
        if (normalized.subtract(normalizedExpected).abs().compareTo(new BigDecimal("0.0001")) > 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private String trimToNull(String value, int maxLength, String message) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private record PaymentResolution(
            BigDecimal totalOriginal,
            BigDecimal totalCobrado,
            BigDecimal redondeoAplicado,
            BigDecimal comisionMonto,
            BigDecimal comisionPorcentaje,
            BigDecimal recibido,
            BigDecimal cambio,
            String referencia,
            String folio,
            Boolean pagoVerificado) {}

}
