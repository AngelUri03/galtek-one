package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CajaSesion",
        indexes = {
                @Index(name = "idx_caja_sesion_empresa_installation_estado", columnList = "id_empresa,id_local_device,status"),
                @Index(name = "idx_caja_sesion_empresa_caja_estado", columnList = "id_empresa,id_caja,status"),
                @Index(name = "idx_caja_sesion_empresa_usuario_estado", columnList = "id_empresa,id_usuario_abre,status"),
                @Index(name = "idx_caja_sesion_empresa_abierta", columnList = "id_empresa,opened_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_caja_sesion_idempotency", columnNames = {"id_empresa", "opening_idempotency_key"}),
                @UniqueConstraint(name = "uk_caja_sesion_active_installation", columnNames = {"active_installation_key"}),
                @UniqueConstraint(name = "uk_caja_sesion_active_user", columnNames = {"active_user_key"})
        })
@Getter
@Setter
public class CajaSesionEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja_sesion")
    private Integer idCajaSesion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_local_device", referencedColumnName = "installation_id", nullable = false)
    private LocalDeviceEntity localDevice;

    @Deprecated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caja")
    private CajasEntity caja;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario_abre", nullable = false)
    private UsuariosEntity openedByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_cierra")
    private UsuariosEntity closedByUser;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "opening_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingAmount = BigDecimal.ZERO;

    @Column(name = "expected_cash_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedCashAmount = BigDecimal.ZERO;

    @Column(name = "closing_expected_cash_amount", precision = 12, scale = 2)
    private BigDecimal closingExpectedCashAmount;

    @Column(name = "counted_cash_amount", precision = 12, scale = 2)
    private BigDecimal countedCashAmount;

    @Column(name = "difference_amount", precision = 12, scale = 2)
    private BigDecimal differenceAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private CajaSesionStatus status;

    @Column(name = "closing_reason", length = 80)
    private String closingReason;

    @Column(name = "closing_notes", length = 500)
    private String closingNotes;

    @Column(name = "opening_idempotency_key", nullable = false, length = 120)
    private String openingIdempotencyKey;

    @Column(name = "closing_idempotency_key", length = 120)
    private String closingIdempotencyKey;

    @Column(name = "expected_balance_viewed_before_count")
    private Boolean expectedBalanceViewedBeforeCount = false;

    @Column(name = "expected_balance_viewed_at")
    private LocalDateTime expectedBalanceViewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expected_balance_viewed_by")
    private UsuariosEntity expectedBalanceViewedBy;

    @Column(name = "active_cash_register_key", length = 80)
    @Deprecated
    private String activeCashRegisterKey;

    @Column(name = "active_installation_key", length = 120)
    private String activeInstallationKey;

    @Column(name = "active_user_key", length = 80)
    private String activeUserKey;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @PrePersist
    @PreUpdate
    private void prepareActiveKeys() {
        if (status == null) {
            throw new IllegalArgumentException("La sesion de caja requiere estatus.");
        }
        if (openingAmount == null || openingAmount.signum() < 0) {
            throw new IllegalArgumentException("El saldo heredado de apertura no puede ser negativo.");
        }
        if (expectedCashAmount == null || expectedCashAmount.signum() < 0) {
            throw new IllegalArgumentException("El efectivo esperado no puede ser negativo.");
        }

        if (status == CajaSesionStatus.OPEN || status == CajaSesionStatus.PENDING_RECONCILIATION) {
            Integer empresaId = empresa != null ? empresa.getIdEmpresa() : null;
            String installationId = localDevice != null ? localDevice.getInstallationId() : null;
            Integer usuarioId = openedByUser != null ? openedByUser.getIdUsuario() : null;

            if (empresaId == null || installationId == null || installationId.isBlank() || usuarioId == null) {
                throw new IllegalArgumentException("La sesion activa requiere empresa, instalacion y usuario.");
            }

            activeInstallationKey = empresaId + ":INSTALLATION:" + installationId;
            activeCashRegisterKey = null;
            activeUserKey = empresaId + ":USER:" + usuarioId;
        } else {
            activeInstallationKey = null;
            activeCashRegisterKey = null;
            activeUserKey = null;
        }
    }

    public BigDecimal getOpeningBalanceSnapshot() {
        return openingAmount;
    }

    public void setOpeningBalanceSnapshot(BigDecimal openingBalanceSnapshot) {
        this.openingAmount = openingBalanceSnapshot;
    }
}
