package com.galtekone.dto.pagos;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class ConfiguracionPagosDTO {
    private Integer idConfiguracionPagos;
    private Boolean terminalEnabled;
    private String terminalProvider;
    private String terminalName;
    private String terminalIdentifier;
    private String terminalSerial;
    private String terminalStoreId;
    private String terminalAccount;
    private List<TerminalPagoConfigDTO> terminales = new ArrayList<>();
    private Integer terminalPriority;
    private Boolean terminalCommissionEnabled;
    private BigDecimal terminalCommissionPercent;
    private Boolean terminalRequireReference;
    private Boolean cashRoundingDefaultEnabled;
    private String cardBankName;
    private String cardHolderName;
    private String cardNumber;
    private String cardAccount;
    private String cardInstructions;
    private String voucherIssuer;
    private String voucherInstructions;
    private Boolean voucherRequireFolio;
    private Boolean voucherRequireAuthorization;
    private String transferBankName;
    private String transferAccountName;
    private String transferClabe;
    private List<MetodoPagoConfigDTO> metodosPago = new ArrayList<>();
}
