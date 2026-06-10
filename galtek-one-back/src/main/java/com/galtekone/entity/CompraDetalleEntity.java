package com.galtekone.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "CompraDetalle")
@Getter
@Setter
public class CompraDetalleEntity extends CommonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_compra_detalle", nullable = false)
    private Integer idCompraDetalle;

    @ManyToOne
    @JoinColumn(name = "id_compra", nullable = false)
    private ComprasEntity compra;

    @OneToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 9, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "subtotal", nullable = false, precision = 9, scale = 2)
    private BigDecimal subtotal;
}
