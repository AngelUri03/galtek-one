package com.galtekone.dto.cliente;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ClienteDirectoryRowDTO {

    private Integer idCliente;
    private String nombre;
    private String alias;
    private String tipoCliente;
    private String estadoCliente;
    private String email;
    private String telefono;
    private String whatsapp;
    private String direccion;
    private String direccionCalle;
    private String direccionNumeroExterior;
    private String direccionNumeroInterior;
    private String direccionColonia;
    private String direccionMunicipio;
    private String direccionEstado;
    private String direccionCodigoPostal;
    private String direccionReferencia;
    private String notasInternas;
    private String rfc;
    private String razonSocial;
    private String codigoPostalFiscal;
    private String correoFiscal;
    private String regimenFiscal;
    private String usoCfdi;
    private String avatar;
    private Boolean estatus;
    private Boolean tieneDatosFiscales;
    private Boolean tieneDireccion;
    private Long comprasRegistradas;
    private PedidoClienteDTO ultimaCompra;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
}
