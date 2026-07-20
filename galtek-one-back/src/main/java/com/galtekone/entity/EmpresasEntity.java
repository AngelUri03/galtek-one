package com.galtekone.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="Empresas")
@Getter
@Setter
public class EmpresasEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_empresa")
	private Integer idEmpresa;
	
	@Column(name = "nombre")
	private String nombreEmpresa;

	@Column(name = "razon_social")
	private String razonSocial;

	@Column(name = "rfc")
	private String rfc;
	
	@ManyToOne
    @JoinColumn(name = "id_tipo_suscripcion", nullable = false)
    private TipoSuscripcionEntity tipoSuscripcion;
	
	@Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;
	
	@Column(name = "fecha_fin")
    private LocalDate fechaFin;
	
	@Column(name = "direccion", nullable = false)
	private String direccion;

	@Column(name = "direccion_calle")
	private String direccionCalle;

	@Column(name = "direccion_numero_exterior")
	private String direccionNumeroExterior;

	@Column(name = "direccion_numero_interior")
	private String direccionNumeroInterior;

	@Column(name = "direccion_colonia")
	private String direccionColonia;

	@Column(name = "direccion_municipio")
	private String direccionMunicipio;

	@Column(name = "direccion_estado")
	private String direccionEstado;

	@Column(name = "direccion_codigo_postal")
	private String direccionCodigoPostal;

	@Column(name = "direccion_referencia")
	private String direccionReferencia;

	@Column(name = "telefono")
	private String telefono;

	@Column(name = "whatsapp")
	private String whatsapp;

	@Column(name = "correo")
	private String correo;

	@Column(name = "horario_operacion")
	private String horarioOperacion;

	@Column(name = "horario_config")
	private String horarioConfig;

	@Column(name = "horario_lunes_viernes_apertura")
	private String horarioLunesViernesApertura;

	@Column(name = "horario_lunes_viernes_cierre")
	private String horarioLunesViernesCierre;

	@Column(name = "horario_sabado_domingo_apertura")
	private String horarioSabadoDomingoApertura;

	@Column(name = "horario_sabado_domingo_cierre")
	private String horarioSabadoDomingoCierre;

	@Column(name = "horario_sabado_domingo_cerrado")
	private Boolean horarioSabadoDomingoCerrado;

	@Column(name = "horario_notas")
	private String horarioNotas;

	@Column(name = "moneda")
	private String moneda;

	@Column(name = "zona_horaria")
	private String zonaHoraria;

	@Column(name = "ticket_mensaje")
	private String ticketMensaje;

	@Column(name = "logo_nombre")
	private String logoNombre;

	@Column(name = "logo_mime_type")
	private String logoMimeType;

	@Column(name = "logo_base64")
	private String logoBase64;
	
	@Column(name = "token_licencia")
	private String tokenLicencia;
	
}
