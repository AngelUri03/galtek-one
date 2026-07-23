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
@Table(name = "CajaRelevo", indexes = {
        @Index(name = "idx_caja_relevo_empresa_device_estado", columnList = "id_empresa,id_local_device,status"),
        @Index(name = "idx_caja_relevo_outgoing_session", columnList = "id_outgoing_session")
})
@Getter
@Setter
public class CajaRelevoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja_relevo")
    private Integer idCajaRelevo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_local_device", referencedColumnName = "installation_id", nullable = false)
    private LocalDeviceEntity localDevice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_outgoing_session")
    private CajaSesionEntity outgoingSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_incoming_session")
    private CajaSesionEntity incomingSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_outgoing_user")
    private UsuariosEntity outgoingUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_incoming_user")
    private UsuariosEntity incomingUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "handoff_type", nullable = false, length = 24)
    private CajaRelevoTipo handoffType = CajaRelevoTipo.DIRECT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private CajaRelevoStatus status = CajaRelevoStatus.PENDING_OUTGOING_COUNT;

    @Column(name = "policy_snapshot", length = 40)
    private String policySnapshot;

    @Column(name = "expected_cash_snapshot", precision = 12, scale = 2)
    private BigDecimal expectedCashSnapshot;

    @Column(name = "outgoing_declared_amount", precision = 12, scale = 2)
    private BigDecimal outgoingDeclaredAmount;

    @Column(name = "outgoing_counted_at")
    private LocalDateTime outgoingCountedAt;

    @Column(name = "incoming_declared_amount", precision = 12, scale = 2)
    private BigDecimal incomingDeclaredAmount;

    @Column(name = "incoming_counted_at")
    private LocalDateTime incomingCountedAt;

    @Column(name = "joint_recount_amount", precision = 12, scale = 2)
    private BigDecimal jointRecountAmount;

    @Column(name = "joint_recount_at")
    private LocalDateTime jointRecountAt;

    @Column(name = "accepted_amount", precision = 12, scale = 2)
    private BigDecimal acceptedAmount;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "outgoing_note", length = 500)
    private String outgoingNote;

    @Column(name = "incoming_note", length = 500)
    private String incomingNote;

    @Column(name = "outgoing_confirmed")
    private Boolean outgoingConfirmed;

    @Column(name = "incoming_confirmed")
    private Boolean incomingConfirmed;

    @Column(name = "outgoing_confirmation_at")
    private LocalDateTime outgoingConfirmationAt;

    @Column(name = "incoming_confirmation_at")
    private LocalDateTime incomingConfirmationAt;

    @Column(name = "difference_outgoing_vs_expected", precision = 12, scale = 2)
    private BigDecimal differenceOutgoingVsExpected;

    @Column(name = "difference_incoming_vs_outgoing", precision = 12, scale = 2)
    private BigDecimal differenceIncomingVsOutgoing;

    @Column(name = "difference_accepted_vs_expected", precision = 12, scale = 2)
    private BigDecimal differenceAcceptedVsExpected;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_incident")
    private CajaIncidenciaEntity incident;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
