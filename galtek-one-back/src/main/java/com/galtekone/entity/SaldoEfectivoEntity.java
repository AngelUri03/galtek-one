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
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "SaldoEfectivo",
        indexes = {
                @Index(name = "idx_saldo_efectivo_empresa_device", columnList = "id_empresa,id_local_device"),
                @Index(name = "idx_saldo_efectivo_empresa_initialized", columnList = "id_empresa,initialized")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_saldo_efectivo_empresa_device",
                        columnNames = {"id_empresa", "id_local_device"})
        })
@Getter
@Setter
public class SaldoEfectivoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_saldo_efectivo")
    private Integer idSaldoEfectivo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_local_device", referencedColumnName = "installation_id", nullable = false)
    private LocalDeviceEntity localDevice;

    @Column(name = "current_balance_snapshot", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentBalanceSnapshot = BigDecimal.ZERO;

    @Column(name = "initialized", nullable = false)
    private Boolean initialized = false;

    @Column(name = "initialized_at")
    private LocalDateTime initializedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initialized_by")
    private UsuariosEntity initializedBy;

    @Column(name = "initialization_category", length = 80)
    private String initializationCategory;

    @Column(name = "initialization_reason", length = 500)
    private String initializationReason;

    @Column(name = "initialization_idempotency_key", length = 120)
    private String initializationIdempotencyKey;

    @Column(name = "last_movement_at")
    private LocalDateTime lastMovementAt;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
