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
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CajaIncidencia", indexes = {
        @Index(name = "idx_caja_incidencia_empresa_estado", columnList = "id_empresa,status"),
        @Index(name = "idx_caja_incidencia_device_estado", columnList = "id_local_device,status"),
        @Index(name = "idx_caja_incidencia_sesion", columnList = "id_caja_sesion")
})
@Getter
@Setter
public class CajaIncidenciaEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja_incidencia")
    private Integer idCajaIncidencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 40)
    private CajaIncidenciaTipo tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private CajaIncidenciaStatus status = CajaIncidenciaStatus.PENDING_REVIEW;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_local_device", referencedColumnName = "installation_id", nullable = false)
    private LocalDeviceEntity localDevice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caja_sesion")
    private CajaSesionEntity cajaSesion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_movimiento_caja")
    private MovimientoCajaEntity movimientoCaja;

    @Column(name = "expected_amount", precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "outgoing_declared_amount", precision = 12, scale = 2)
    private BigDecimal outgoingDeclaredAmount;

    @Column(name = "incoming_declared_amount", precision = 12, scale = 2)
    private BigDecimal incomingDeclaredAmount;

    @Column(name = "joint_recount_amount", precision = 12, scale = 2)
    private BigDecimal jointRecountAmount;

    @Column(name = "accepted_amount", precision = 12, scale = 2)
    private BigDecimal acceptedAmount;

    @Column(name = "difference_amount", precision = 12, scale = 2)
    private BigDecimal differenceAmount;

    @Column(name = "outgoing_note", length = 500)
    private String outgoingNote;

    @Column(name = "incoming_note", length = 500)
    private String incomingNote;

    @Column(name = "policy_snapshot", length = 40)
    private String policySnapshot;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private UsuariosEntity resolvedBy;

    @Column(name = "resolution_category", length = 80)
    private String resolutionCategory;

    @Column(name = "resolution_notes", length = 700)
    private String resolutionNotes;

    @Column(name = "resolution_cash_effect", length = 60)
    private String resolutionCashEffect;

    @Column(name = "resolution_amount", precision = 12, scale = 2)
    private BigDecimal resolutionAmount;

    @Column(name = "resolution_reference", length = 160)
    private String resolutionReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_resolution_movement")
    private MovimientoCajaEntity resolutionMovement;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
