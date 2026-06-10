package com.galtekone.entity;

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
public class ProveedoresEntity extends CommonEntity{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Integer idProveedor;
    
    @Column(name = "nombre")
    private String nombreProveedor;
    
    @Column(name = "contacto", nullable = false)
    private String contacto;
    
    @Column(name = "telefono", nullable =  false)
    private String telefono;
    
    @Column(name = "correo", nullable =  false)
    private String correo;
    
    @Column(name = "direccion", nullable = false)
    private String direccion;
    
    @ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_empresa", nullable = false)
	private EmpresasEntity empresa;
}