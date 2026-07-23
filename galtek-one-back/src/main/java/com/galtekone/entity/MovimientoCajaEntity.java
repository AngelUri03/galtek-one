package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MovimientoCaja", indexes = {
        @Index(name = "idx_mov_caja_empresa_fecha", columnList = "id_empresa, fecha"),
        @Index(name = "idx_mov_caja_caja_empresa", columnList = "id_caja, id_empresa"),
        @Index(name = "idx_mov_caja_sesion", columnList = "id_caja_sesion"),
        @Index(name = "idx_mov_caja_device_empresa", columnList = "id_local_device, id_empresa"),
        @Index(name = "idx_mov_caja_idempotency", columnList = "id_empresa, idempotency_key")
})
@Getter
@Setter
public class MovimientoCajaEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento_caja")
    private Integer idMovimientoCaja;

    @Deprecated
    @ManyToOne
    @JoinColumn(name = "id_caja")
    private CajasEntity caja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caja_sesion")
    private CajaSesionEntity cajaSesion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_local_device", referencedColumnName = "installation_id")
    private LocalDeviceEntity localDevice;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuariosEntity usuario;

    @Column(name = "tipo", nullable = false, length = 30)
    private String tipo;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "category", length = 80)
    private String category;

    @Column(name = "financial_direction", length = 20)
    private String financialDirection;

    @Column(name = "reference_type", length = 60)
    private String referenceType;

    @Column(name = "reference_id", length = 80)
    private String referenceId;

    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @Column(name = "balance_before", precision = 12, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @PrePersist
    @PreUpdate
    private void validarTipo() {
        if (!MovimientoCajaTipo.isAllowed(tipo)) {
            throw new IllegalArgumentException("Tipo de movimiento de caja invalido.");
        }
        if (monto == null || monto.signum() < 0) {
            throw new IllegalArgumentException("El monto del movimiento de caja no puede ser negativo.");
        }
        if (!MovimientoCajaTipo.allowsZeroAmount(tipo) && monto.signum() == 0) {
            throw new IllegalArgumentException("El monto del movimiento de caja debe ser mayor a cero.");
        }
        if (MovimientoCajaTipo.requiresExplicitDirection(tipo)
                && (financialDirection == null || financialDirection.isBlank())) {
            throw new IllegalArgumentException("El movimiento de conciliacion requiere direccion financiera.");
        }
    }
}

