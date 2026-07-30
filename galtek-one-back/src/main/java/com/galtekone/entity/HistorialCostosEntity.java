package com.galtekone.entity;

import java.math.BigDecimal;

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
@Table(name = "HistorialCostos")
@Getter
@Setter
public class HistorialCostosEntity extends CommonEntity implements BaseEmpresa {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_historial_costos")
	private Integer idHistorialCostos;
	
	@ManyToOne(optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "precio_compra", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioCompra;
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
	

}
