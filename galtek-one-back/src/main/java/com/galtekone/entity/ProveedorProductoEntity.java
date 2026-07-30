package com.galtekone.entity;

import java.math.BigDecimal;
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
@Getter
@Setter
@Table(name = "ProveedorProducto")
public class ProveedorProductoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_producto")
    private Integer idProveedorProducto;

    @ManyToOne
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "precio_compra")
    private Float precioCompra;

    @Column(name = "sku_proveedor")
    private String skuProveedor;

    @Column(name = "ultimo_costo", precision = 12, scale = 2)
    private BigDecimal ultimoCosto;

    @Column(name = "fecha_ultimo_costo")
    private LocalDateTime fechaUltimoCosto;

    @Column(name = "presentacion_compra")
    private String presentacionCompra;

    @Column(name = "cantidad_minima", precision = 12, scale = 3)
    private BigDecimal cantidadMinima;

    @Column(name = "proveedor_preferido")
    private Boolean proveedorPreferido = false;

    @Column(name = "estado_relacion")
    private String estadoRelacion = "ACTIVA";
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;

}

