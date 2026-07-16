package com.galtekone.dto.cliente;

import java.util.List;

import lombok.*;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClienteConPedidosDTO {
	
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
	    private java.time.LocalDateTime fechaCreacion;
	    private java.time.LocalDateTime fechaModificacion;
	    private String usuarioCreacion;
	    private String usuarioModificacion;
	    private String ultimaAccionEstado;
	    private String motivoCambioEstado;
	    private String usuarioCambioEstado;
	    private java.time.LocalDateTime fechaCambioEstado;
	    private Long comprasRegistradas;
	    private List<PedidoClienteDTO> pedidos;

}
