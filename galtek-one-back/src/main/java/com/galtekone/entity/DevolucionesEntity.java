package com.galtekone.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="Devoluciones")
@Getter
@Setter
public class DevolucionesEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_devolucion")
	private Integer idDevolucion;

	@OneToOne
	@JoinColumn(name = "id_venta", nullable = false)
	private VentasEntity venta;
	
    @Column(name = "total_devolucion", nullable = false, precision = 9, scale = 2)
    private BigDecimal totalDevolucion;
    
    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
	

}
