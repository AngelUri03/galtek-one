package com.galtekone.entity;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import com.galtekone.utils.BaseEmpresa;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="Ventas")
@Getter
@Setter
public class VentasEntity extends CommonEntity implements BaseEmpresa {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Integer idVenta;
   // @Column(name = "nombre_venta")
    //private String nombreVenta;
    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable =  false)
    private UsuariosEntity usuario;
    
    @ManyToOne
    @JoinColumn(name = "id_empresa", nullable =  false)
    private EmpresasEntity empresa;
    
    @Column(name = "total", nullable = false)
    private Float total;

    @Column(name = "total_original", precision = 12, scale = 2)
    private BigDecimal totalOriginal;

    @Column(name = "total_cobrado", precision = 12, scale = 2)
    private BigDecimal totalCobrado;

    @Column(name = "redondeo_aplicado", precision = 12, scale = 2)
    private BigDecimal redondeoAplicado;

    @Column(name = "comision_pago", precision = 12, scale = 2)
    private BigDecimal comisionPago;

    @Column(name = "comision_porcentaje", precision = 7, scale = 4)
    private BigDecimal comisionPorcentaje;

    @Column(name = "recibido", precision = 12, scale = 2)
    private BigDecimal recibido;

    @Column(name = "cambio", precision = 12, scale = 2)
    private BigDecimal cambio;

    @Column(name = "referencia_pago", length = 120)
    private String referenciaPago;

    @Column(name = "folio_pago", length = 120)
    private String folioPago;

    @Column(name = "pago_verificado")
    private Boolean pagoVerificado;
    
    @ManyToOne
    @JoinColumn(name = "id_metodo_pago", nullable = false)
    private MetodoPagoEntity metodoPago;
    
    @Deprecated
    @ManyToOne
    @JoinColumn(name = "id_caja")
    private CajasEntity caja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caja_sesion")
    private CajaSesionEntity cajaSesion;
    
    @Column(name = "estado", nullable = false)
    private String estado;
    
    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private ClientesEntity cliente;

    @OneToMany(mappedBy = "venta", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<VentaDetalleEntity> detalles;

}

