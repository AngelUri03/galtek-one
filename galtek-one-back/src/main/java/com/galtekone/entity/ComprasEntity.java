package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
@Table(name="Compras")
@Getter
@Setter
public class ComprasEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_compra")
	private Integer idCompra;
	
	@ManyToOne
	@JoinColumn(name = "id_proveedor", nullable = false)
	private ProveedoresEntity IdProveedor;
	
	@ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuariosEntity IdUsuario;
	
	@Column(name = "fecha_compra")
	private LocalDateTime fechaCompra;
	
	@Column(name = "total_compra")
	private BigDecimal totalCompra;
	
    @Column(name = "ticket_proveedor", nullable = false)
    private byte[] ticketProveedor;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;

}
