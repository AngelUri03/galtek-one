package com.galtekone.entity;

import com.galtekone.utils.BaseEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@Entity
@EqualsAndHashCode(callSuper=false)
@Table(name = "ProductoEstadoStock")
public class ProductoEstadoStockEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto_estado_stock")
    private Integer idProductoEstadoStock;

    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @ManyToOne
    @JoinColumn(name = "id_estado_stock", nullable = false)
    private EstadoStockEntity estadoStock;

    @Column(name = "minimo", nullable = false)
    private BigDecimal minimo;

    @Column(name = "maximo", nullable = false)
    private BigDecimal maximo;

    @ManyToOne
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

}

