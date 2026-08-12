package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ProductoPrecioHistorial")
@Getter
@Setter
public class ProductoPrecioHistorialEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto_precio_historial")
    private Integer idProductoPrecioHistorial;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "precio_anterior", precision = 12, scale = 2)
    private BigDecimal precioAnterior;

    @Column(name = "precio_nuevo", precision = 12, scale = 2)
    private BigDecimal precioNuevo;

    @Column(name = "motivo", length = 500)
    private String motivo;

    @Column(name = "usuario", length = 100)
    private String usuario;

    @Column(name = "fecha_evento", nullable = false)
    private LocalDateTime fechaEvento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

}