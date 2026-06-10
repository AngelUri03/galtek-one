package com.galtekone.entity;

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
    
    @ManyToOne
    @JoinColumn(name = "id_metodo_pago", nullable = false)
    private MetodoPagoEntity metodoPago;
    
    @ManyToOne
    @JoinColumn(name = "id_caja", nullable = false)
    private CajasEntity caja;
    
    @Column(name = "estado", nullable = false)
    private String estado;
    
    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private ClientesEntity cliente;

    @OneToMany(mappedBy = "venta", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<VentaDetalleEntity> detalles;

}

