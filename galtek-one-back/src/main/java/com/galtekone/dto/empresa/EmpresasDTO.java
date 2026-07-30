package com.galtekone.dto.empresa;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmpresasDTO {

    private String nombre;
    private String razonSocial;
    private String rfc;
    private Integer idTipoSuscripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String direccion;
    private String direccionCalle;
    private String direccionNumeroExterior;
    private String direccionNumeroInterior;
    private String direccionColonia;
    private String direccionMunicipio;
    private String direccionEstado;
    private String direccionCodigoPostal;
    private String direccionReferencia;
    private String telefono;
    private String whatsapp;
    private String correo;
    private String horarioOperacion;
    private String horarioConfig;
    private String horarioLunesViernesApertura;
    private String horarioLunesViernesCierre;
    private String horarioSabadoDomingoApertura;
    private String horarioSabadoDomingoCierre;
    private Boolean horarioSabadoDomingoCerrado;
    private String horarioNotas;
    private String moneda;
    private String zonaHoraria;
    private String ticketMensaje;
    private String logoNombre;
    private String logoMimeType;
    private String logoBase64;
    private String tokenLicencia;
}
