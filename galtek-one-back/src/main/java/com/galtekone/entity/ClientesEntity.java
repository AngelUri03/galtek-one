package com.galtekone.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "Clientes")
@Getter
@Setter
public class ClientesEntity extends CommonEntity implements BaseEmpresa {
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_cliente")
	private Integer idCliente;

	@Column(name = "nombre", nullable = false)
	private String nombre;

	@Column(name = "alias")
	private String alias;

	@Column(name = "tipo_cliente")
	private String tipoCliente = "PERSONA";

	@Column(name = "estado_cliente")
	private String estadoCliente = "ACTIVO";

	@Column(name = "estado_cliente_anterior")
	private String estadoClienteAnterior;

	@Column(name = "ultima_accion_estado")
	private String ultimaAccionEstado;

	@Column(name = "motivo_cambio_estado", length = 500)
	private String motivoCambioEstado;

	@Column(name = "usuario_cambio_estado")
	private String usuarioCambioEstado;

	@Column(name = "fecha_cambio_estado")
	private java.time.LocalDateTime fechaCambioEstado;

	@Column(name = "email")
	private String email;

	@Column(name = "telefono")
	private String telefono;

	@Column(name = "whatsapp")
	private String whatsapp;
	
	@Column(name = "direccion")
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

	@Column(name = "direccion_referencia", length = 1000)
	private String direccionReferencia;

	@Column(name = "notas_internas", length = 2000)
	private String notasInternas;

	@Column(name = "rfc")
	private String rfc;

	@Column(name = "razon_social")
	private String razonSocial;

	@Column(name = "codigo_postal_fiscal")
	private String codigoPostalFiscal;

	@Column(name = "correo_fiscal")
	private String correoFiscal;

	@Column(name = "regimen_fiscal")
	private String regimenFiscal;

	@Column(name = "uso_cfdi")
	private String usoCfdi;
	
	@Column(name = "avatar")
	private String avatar;
	
	@ManyToOne
	@JoinColumn(name = "id_empresa")
	private EmpresasEntity empresa;
	
	@OneToMany(mappedBy = "cliente", fetch = FetchType.LAZY)
	@JsonIgnore
	private List<VentasEntity> pedidos;

}
