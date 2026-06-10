package com.galtekone.entity;

import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;
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
@Table(name="EntradasSalidas")
@Getter
@Setter

public class EntradasSalidasEntity extends CommonEntity implements BaseEmpresa {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_registro")
	private Integer idRegistro;
	
	@ManyToOne(optional = false)
	@JoinColumn(name = "id_usuario", nullable = false)
	private UsuariosEntity usuario;
	
	@Column(name = "tipo", nullable = false)
	private String tipo;
	
	@Column(name = "fecha_hora", nullable = false)
	private LocalDateTime fechaHora;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
}
