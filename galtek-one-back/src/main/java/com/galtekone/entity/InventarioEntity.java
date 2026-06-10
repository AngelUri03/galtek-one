package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
@Table(name="Inventario")
@Getter
@Setter
public class InventarioEntity extends CommonEntity{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inventario")
    private Integer idInventario;
    //@Column(name = "nombre_inventario")
    //private String nombreInventario;
     @ManyToOne
     @JoinColumn(name = "id_producto", nullable = false)
     private ProductosEntity producto;

     @ManyToOne
     @JoinColumn(name = "id_almacen", nullable = false)
    private AlmacenEntity almacen;

    @Column(name = "existencia", precision = 10, scale = 3, nullable = false)
    private BigDecimal existencia;

    @Column(name = "fecha_ultima_compra", nullable = false)
    private LocalDateTime fechaUltimaCompra;
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;

}
 
