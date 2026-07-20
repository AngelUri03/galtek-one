package com.galtekone.entity;

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
@Table(name = "ConfiguracionTicket")
@Getter
@Setter
public class ConfiguracionTicketEntity extends CommonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion_ticket")
    private Integer idConfiguracionTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @Column(name = "paper_size")
    private String paperSize;

    @Column(name = "density")
    private String density;

    @Column(name = "font_size")
    private String fontSize;

    @Column(name = "font_family")
    private String fontFamily;

    @Column(name = "line_spacing")
    private String lineSpacing;

    @Column(name = "margin_size")
    private String marginSize;

    @Column(name = "separator_style")
    private String separatorStyle;

    @Column(name = "alignment")
    private String alignment;

    @Column(name = "default_printer_name")
    private String defaultPrinterName;

    @Column(name = "copies")
    private Integer copies;

    @Column(name = "auto_print")
    private Boolean autoPrint;

    @Column(name = "ask_before_print")
    private Boolean askBeforePrint;

    @Column(name = "allow_reprint")
    private Boolean allowReprint;

    @Column(name = "show_logo")
    private Boolean showLogo;

    @Column(name = "footer_message")
    private String footerMessage;

    @Column(name = "template_json", columnDefinition = "text")
    private String templateJson;
}
