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
@Table(name="MetodoPago")
@Getter
@Setter
public class MetodoPagoEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_metodo_pago")
	private Integer idMetodoPago;
	
	@Column(name = "nombre")
	private String nombreMetodoPago;

	@Column(name = "codigo", length = 40)
	private String codigo;

	@Column(name = "tipo", length = 40)
	private String tipo;

	@Column(name = "orden")
	private Integer orden;

	@Column(name = "visible_pos")
	private Boolean visiblePos = true;

	@Column(name = "requiere_referencia")
	private Boolean requiereReferencia = false;

	@Column(name = "requiere_verificacion")
	private Boolean requiereVerificacion = false;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
}
