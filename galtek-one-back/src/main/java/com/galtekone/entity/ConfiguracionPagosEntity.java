package com.galtekone.entity;

import java.math.BigDecimal;

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
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ConfiguracionPagos",
        uniqueConstraints = @UniqueConstraint(name = "uk_configuracion_pagos_empresa", columnNames = "id_empresa"))
@Getter
@Setter
public class ConfiguracionPagosEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion_pagos")
    private Integer idConfiguracionPagos;

    @Column(name = "terminal_enabled", nullable = false)
    private Boolean terminalEnabled = true;

    @Column(name = "terminal_provider", nullable = false, length = 60)
    private String terminalProvider = "MERCADO_PAGO";

    @Column(name = "terminal_name", length = 120)
    private String terminalName = "Mercado Pago";

    @Column(name = "terminal_identifier", length = 120)
    private String terminalIdentifier;

    @Column(name = "terminal_serial", length = 120)
    private String terminalSerial;

    @Column(name = "terminal_store_id", length = 120)
    private String terminalStoreId;

    @Column(name = "terminal_account", length = 160)
    private String terminalAccount;

    @Column(name = "terminales_json", columnDefinition = "TEXT")
    private String terminalesJson;

    @Column(name = "terminal_priority", nullable = false)
    private Integer terminalPriority = 1;

    @Column(name = "terminal_commission_enabled", nullable = false)
    private Boolean terminalCommissionEnabled = true;

    @Column(name = "terminal_commission_percent", nullable = false, precision = 7, scale = 4)
    private BigDecimal terminalCommissionPercent = BigDecimal.ZERO;

    @Column(name = "terminal_require_reference", nullable = false)
    private Boolean terminalRequireReference = true;

    @Column(name = "cash_rounding_default_enabled", nullable = false)
    private Boolean cashRoundingDefaultEnabled = true;

    @Column(name = "card_bank_name", length = 120)
    private String cardBankName;

    @Column(name = "card_holder_name", length = 160)
    private String cardHolderName;

    @Column(name = "card_number", length = 40)
    private String cardNumber;

    @Column(name = "card_account", length = 60)
    private String cardAccount;

    @Column(name = "card_instructions", length = 220)
    private String cardInstructions;

    @Column(name = "voucher_issuer", length = 120)
    private String voucherIssuer;

    @Column(name = "voucher_instructions", length = 220)
    private String voucherInstructions;

    @Column(name = "voucher_require_folio", nullable = false)
    private Boolean voucherRequireFolio = true;

    @Column(name = "voucher_require_authorization", nullable = false)
    private Boolean voucherRequireAuthorization = true;

    @Column(name = "transfer_bank_name", length = 120)
    private String transferBankName;

    @Column(name = "transfer_account_name", length = 160)
    private String transferAccountName;

    @Column(name = "transfer_clabe", length = 32)
    private String transferClabe;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
