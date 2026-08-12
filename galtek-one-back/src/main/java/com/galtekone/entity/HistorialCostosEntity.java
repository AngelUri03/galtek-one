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
@Table(name = "HistorialCostos")
@Getter
@Setter
public class HistorialCostosEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial_costos")
    private Integer idHistorialCostos;

    /**
     * Proveedor al que pertenece el costo.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    /**
     * Producto cuyo costo cambió.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductosEntity producto;

    /**
     * Costo anterior.
     */
    @Column(name = "costo_anterior", precision = 12, scale = 2)
    private BigDecimal costoAnterior;

    /**
     * Nuevo costo.
     */
    @Column(name = "costo_nuevo", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoNuevo;

    /**
     * Diferencia entre ambos costos.
     * Puede calcularse desde la aplicación antes de guardar.
     */
    @Column(name = "diferencia", precision = 12, scale = 2)
    private BigDecimal diferencia;

    /**
     * Motivo del cambio.
     * Ejemplos:
     * - Nueva lista de precios
     * - Negociación
     * - Corrección
     * - Actualización manual
     */
    @Column(name = "motivo", length = 500)
    private String motivo;

    /**
     * Documento o referencia que originó el cambio.
     * Ejemplos:
     * OC-1520
     * FACT-000123
     * Lista Julio 2026
     */
    @Column(name = "referencia", length = 100)
    private String referencia;

    /**
     * Usuario que realizó el cambio.
     * Idealmente en el futuro debería ser una relación con UsuariosEntity.
     */
    @Column(name = "usuario", length = 100)
    private String usuario;

    /**
     * Fecha y hora del cambio.
     */
    @Column(name = "fecha_cambio", nullable = false)
    private LocalDateTime fechaCambio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

}