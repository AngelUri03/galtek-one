package com.galtekone.dto.ticket;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketConfigDTO {

    private Integer idConfiguracionTicket;
    private Integer idEmpresa;
    private String paperSize;
    private String density;
    private String fontSize;
    private String fontFamily;
    private String lineSpacing;
    private String marginSize;
    private String separatorStyle;
    private String alignment;
    private String defaultPrinterName;
    private Integer copies;
    private Boolean autoPrint;
    private Boolean askBeforePrint;
    private Boolean allowReprint;
    private Boolean showLogo;
    private String footerMessage;
    private String templateJson;
    private Boolean customized;
    private LocalDateTime fechaModificacion;
    private Map<String, Object> tienda;
}
