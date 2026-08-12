package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "InventarioMovimiento")
@Getter
@Setter
public class InventarioMovimientoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inventario_movimiento")
    private Integer idInventarioMovimiento;

    /**
     * Producto afectado.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    /**
     * Lote afectado (opcional).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_lote")
    private LotesEntity lote;

    /**
     * Almacén donde ocurrió el movimiento.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_almacen", nullable = false)
    private AlmacenEntity almacen;

    /**
     * COMPRA
     * VENTA
     * AJUSTE_POSITIVO
     * AJUSTE_NEGATIVO
     * MERMA
     * CADUCIDAD
     * DEVOLUCION_CLIENTE
     * DEVOLUCION_PROVEEDOR
     * TRASPASO_ENTRADA
     * TRASPASO_SALIDA
     */
    @Column(name = "tipo_movimiento", nullable = false, length = 30)
    private String tipoMovimiento;

    /**
     * Cantidad del movimiento.
     */
    @Column(name = "cantidad", nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    /**
     * Existencia antes del movimiento.
     */
    @Column(name = "existencia_anterior", precision = 12, scale = 3)
    private BigDecimal existenciaAnterior;

    /**
     * Existencia después del movimiento.
     */
    @Column(name = "existencia_nueva", precision = 12, scale = 3)
    private BigDecimal existenciaNueva;

    /**
     * Tipo de documento origen.
     * Ejemplo: COMPRA, VENTA, AJUSTE, TRASPASO.
     */
    @Column(name = "tipo_documento", length = 30)
    private String tipoDocumento;

    /**
     * Id del documento origen.
     */
    @Column(name = "id_documento")
    private Integer idDocumento;

    /**
     * Folio o referencia del documento.
     */
    @Column(name = "referencia", length = 150)
    private String referencia;

    /**
     * Motivo del movimiento.
     */
    @Column(name = "motivo", length = 500)
    private String motivo;

    /**
     * Observaciones adicionales.
     */
    @Column(name = "observaciones", length = 2000)
    private String observaciones;

    /**
     * Usuario que realizó el movimiento.
     */
    @Column(name = "usuario", length = 100)
    private String usuario;

    /**
     * Fecha y hora del movimiento.
     */
    @Column(name = "fecha_movimiento", nullable = false)
    private LocalDateTime fechaMovimiento = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

}