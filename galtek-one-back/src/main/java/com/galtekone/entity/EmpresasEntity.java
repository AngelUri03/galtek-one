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
	
	@ManyToOne
    @JoinColumn(name = "id_tipo_suscripcion", nullable = false)
    private TipoSuscripcionEntity tipoSuscripcion;
	
	@Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;
	
	@Column(name = "fecha_fin")
    private LocalDate fechaFin;
	
	@Column(name = "direccion", nullable = false)
	private String direccion;
	
	@Column(name = "token_licencia")
	private String tokenLicencia;
	
}
