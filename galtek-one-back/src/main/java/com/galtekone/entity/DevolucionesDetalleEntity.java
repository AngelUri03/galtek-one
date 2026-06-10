package com.galtekone.entity;

import java.math.BigDecimal;

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
@Table(name="DevolucionesDetalle")
@Getter
@Setter

public class DevolucionesDetalleEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_devolucion_detalle")
	private Integer idDevolucionDetalle;
	
	@ManyToOne
	@JoinColumn(name = "id_devolucion", nullable = false)
	private DevolucionesEntity devolucion;
	
	@ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;
	
	@Column(name = "cantidad_devuelta")
	private Integer cantidad;
	
	@Column(name = "subtotal_devuelto")
	private BigDecimal subtotal;

}
