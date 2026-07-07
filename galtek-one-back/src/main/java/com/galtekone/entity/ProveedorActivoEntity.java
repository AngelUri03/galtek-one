package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

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
@Table(name = "ProveedorActivo")
@Getter
@Setter
public class ProveedorActivoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_activo")
    private Integer idProveedorActivo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "numero_serie")
    private String numeroSerie;

    @Column(name = "fecha_entrega")
    private LocalDate fechaEntrega;

    @Column(name = "estado_fisico")
    private String estadoFisico;

    @Column(name = "ubicacion_tienda")
    private String ubicacionTienda;

    @Column(name = "condiciones_prestamo", length = 2000)
    private String condicionesPrestamo;

    @Column(name = "deposito_garantia", precision = 12, scale = 2)
    private BigDecimal depositoGarantia;

    @Column(name = "estado_activo_prestado")
    private String estadoActivoPrestado = "EN_TIENDA";

    @Column(name = "notas", length = 2000)
    private String notas;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
