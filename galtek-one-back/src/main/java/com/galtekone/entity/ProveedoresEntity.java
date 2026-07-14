package com.galtekone.entity;

import java.math.BigDecimal;

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
@Table(name="Proveedores")
@Getter
@Setter
public class ProveedoresEntity extends CommonEntity implements BaseEmpresa{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Integer idProveedor;
    
    @Column(name = "nombre", nullable = false)
    private String nombreProveedor;

    @Column(name = "razon_social")
    private String razonSocial;

    @Column(name = "rfc")
    private String rfc;

    @Column(name = "tipo_proveedor")
    private String tipoProveedor;

    @Column(name = "categoria_principal")
    private String categoriaPrincipal;

    @Column(name = "estado_proveedor")
    private String estadoProveedor = "ACTIVO";

    @Column(name = "estado_proveedor_anterior")
    private String estadoProveedorAnterior;

    @Column(name = "ultima_accion_estado")
    private String ultimaAccionEstado;

    @Column(name = "motivo_cambio_estado", length = 500)
    private String motivoCambioEstado;

    @Column(name = "usuario_cambio_estado")
    private String usuarioCambioEstado;

    @Column(name = "fecha_cambio_estado")
    private java.time.LocalDateTime fechaCambioEstado;

    @Column(name = "notas_internas", length = 2000)
    private String notasInternas;
    
    @Column(name = "contacto")
    private String contacto;
    
    @Column(name = "telefono")
    private String telefono;
    
    @Column(name = "correo")
    private String correo;
    
    @Column(name = "direccion")
    private String direccion;

    @Column(name = "modalidad_abastecimiento")
    private String modalidadAbastecimiento;

    @Column(name = "pedido_whatsapp")
    private Boolean pedidoWhatsapp = false;

    @Column(name = "pedido_llamada")
    private Boolean pedidoLlamada = false;

    @Column(name = "pedido_app")
    private Boolean pedidoApp = false;

    @Column(name = "visita_ruta")
    private Boolean visitaRuta = false;

    @Column(name = "compra_mostrador")
    private Boolean compraMostrador = false;

    @Column(name = "dias_visita_entrega")
    private String diasVisitaEntrega;

    @Column(name = "horario_habitual")
    private String horarioHabitual;

    @Column(name = "pedido_minimo", precision = 12, scale = 2)
    private BigDecimal pedidoMinimo;

    @Column(name = "tiempo_estimado_entrega")
    private String tiempoEstimadoEntrega;

    @Column(name = "costo_envio", precision = 12, scale = 2)
    private BigDecimal costoEnvio;

    @Column(name = "observaciones_abastecimiento", length = 2000)
    private String observacionesAbastecimiento;

    @Column(name = "forma_pago_principal")
    private String formaPagoPrincipal;

    @Column(name = "maneja_credito")
    private Boolean manejaCredito = false;

    @Column(name = "dias_credito")
    private Integer diasCredito;

    @Column(name = "limite_credito", precision = 12, scale = 2)
    private BigDecimal limiteCredito;

    @Column(name = "permite_devoluciones")
    private Boolean permiteDevoluciones = false;

    @Column(name = "cambios_caducidad")
    private Boolean cambiosCaducidad = false;

    @Column(name = "bonificaciones")
    private Boolean bonificaciones = false;

    @Column(name = "descuentos_frecuentes")
    private Boolean descuentosFrecuentes = false;

    @Column(name = "notas_comerciales", length = 2000)
    private String notasComerciales;
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
}
