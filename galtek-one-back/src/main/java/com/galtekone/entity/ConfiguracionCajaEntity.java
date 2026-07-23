package com.galtekone.entity;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ConfiguracionCaja",
        uniqueConstraints = @UniqueConstraint(name = "uk_configuracion_caja_empresa", columnNames = "id_empresa"))
@Getter
@Setter
public class ConfiguracionCajaEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion_caja")
    private Integer idConfiguracionCaja;

    @Enumerated(EnumType.STRING)
    @Column(name = "handoff_policy", nullable = false, length = 32)
    private CajaPoliticaOperacion handoffPolicy = CajaPoliticaOperacion.CONTINUITY_FIRST;

    @Column(name = "require_incoming_count_on_user_change", nullable = false)
    private Boolean requireIncomingCountOnUserChange = true;

    @Column(name = "require_outgoing_count", nullable = false)
    private Boolean requireOutgoingCount = true;

    @Column(name = "allow_continue_with_pending_incident", nullable = false)
    private Boolean allowContinueWithPendingIncident = true;

    @Column(name = "blind_count_enabled", nullable = false)
    private Boolean blindCountEnabled = true;

    @Column(name = "expected_balance_visibility_mode", nullable = false, length = 40)
    private String expectedBalanceVisibilityMode = "PERMISSION_REQUIRED";

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
