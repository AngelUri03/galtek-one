package com.galtekone.dto.proveedor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ProveedorDirectoryRowDTO {

    private Integer idProveedor;
    private String nombreProveedor;
    private String razonSocial;
    private String rfc;
    private String tipoProveedor;
    private String categoriaPrincipal;
    private String estadoProveedor;
    private String contacto;
    private String telefono;
    private String correo;
    private String direccion;
    private String modalidadAbastecimiento;
    private String formaPagoPrincipal;
    private Boolean pedidoWhatsapp;
    private Boolean pedidoLlamada;
    private Boolean pedidoApp;
    private Boolean visitaRuta;
    private Boolean compraMostrador;
    private Boolean manejaCredito;
    private Boolean estatus;
    private BigDecimal pedidoMinimo;
    private BigDecimal costoEnvio;
    private Integer diasCredito;
    private BigDecimal limiteCredito;
    private Long productosAsociadosCount;
    private Long activosPrestadosCount;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
}
