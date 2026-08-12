package com.galtekone.entity;

import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ProductoHistorial")
@Getter
@Setter
public class ProductoHistorialEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto_historial")
    private Integer idProductoHistorial;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    @Column(name = "tipo_evento", nullable = false, length = 50)
    private String tipoEvento;

    @Column(name = "campo_modificado", length = 100)
    private String campoModificado;

    @Column(name = "valor_anterior", length = 4000)
    private String valorAnterior;

    @Column(name = "valor_nuevo", length = 4000)
    private String valorNuevo;

    @Column(name = "descripcion", length = 2000)
    private String descripcion;

    @Column(name = "usuario", length = 100)
    private String usuario;

    @Column(name = "fecha_evento", nullable = false)
    private LocalDateTime fechaEvento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

}