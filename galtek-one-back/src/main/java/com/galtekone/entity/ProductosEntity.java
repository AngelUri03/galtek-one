package com.galtekone.entity;

import com.galtekone.utils.BaseEmpresa;
import jakarta.persistence.*;
//import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Table(name = "Productos")
@Getter
@Setter
public class ProductosEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;

    @Column(name = "nombre", nullable = false)
    private String nombreProducto;

    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    @Column(name = "codigo_barras", nullable = false)
    private String codigoBarras;

    @ManyToOne
    @JoinColumn(name = "id_unidad", nullable = false)
    private UnidadesEntity unidad;

    @Column(name = "es_pesaje", nullable = false)
    private Boolean esPesaje;

    @Column(name = "precio_venta", nullable = false)
    private Float precioVenta;

    @ManyToOne
    @JoinColumn(name = "id_categoria", nullable = false)
    private CategoriasEntity categoria;

    @Column(name = "direccion", nullable = false)
    private String direccion;

    @Column(name = "imagen")
    private String imagen;

    // @Lob
    // @Column(name = "imagen", columnDefinition = "TEXT")
    // private String imagen;
    //
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @Transient
    private Integer idProveedor;

    @Transient
    private Float precioCompra;

    // Reverse mappings for JPA Specification Navigation
    @JsonIgnore
    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY)
    private List<ProveedorProductoEntity> proveedores;

    @JsonIgnore
    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY)
    private List<ProductoEstadoStockEntity> reglasStock;

    @JsonIgnore
    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<LotesEntity> lotes;

}
