package com.galtekone.entity;

import com.galtekone.utils.BaseEmpresa;
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

import java.math.BigDecimal;

@Entity
@Table(name="VentaDetalle")
@Getter
@Setter

public class VentaDetalleEntity extends CommonEntity implements BaseEmpresa {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_venta_detalle")
	private Integer idVentaDetalle;
	
	@ManyToOne
	@JoinColumn(name = "id_venta", nullable = false)
	private VentasEntity venta;
	
	@ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "cantidad", precision = 10, scale = 3, nullable = false)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario")
	private Float precioUnitario;
	
	@Column(name = "subtotal")
	private Float subtotal;

    @ManyToOne
    @JoinColumn(name = "id_empresa", nullable =  false)
    private EmpresasEntity empresa;

}
