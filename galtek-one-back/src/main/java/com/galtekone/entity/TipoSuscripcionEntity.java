package com.galtekone.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="TipoSuscripcion")
@Getter
@Setter
public class TipoSuscripcionEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_tipo_suscripcion")
	private Integer idTipoSuscripcion;

	@Column(name = "nombre")
	private String nombreTipoSuscripcion;

	}
