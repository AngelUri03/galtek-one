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
@Table(name = "Permisos")
@Getter
@Setter
public class PermisosEntity extends CommonEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_permiso")
	private Integer idPermiso;

	@Column(name = "clave", nullable = false, length = 80)
	private String clave;

	@Column(name = "nombre", nullable = false, length = 120)
	private String nombre;

	@Column(name = "descripcion", length = 255)
	private String descripcion;

	@Column(name = "modulo", nullable = false, length = 60)
	private String modulo;

	@Column(name = "accion", length = 40)
	private String accion;
	
}
