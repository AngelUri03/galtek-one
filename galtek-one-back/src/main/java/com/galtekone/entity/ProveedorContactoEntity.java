package com.galtekone.entity;

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
@Table(name = "ProveedorContacto")
@Getter
@Setter
public class ProveedorContactoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_contacto")
    private Integer idProveedorContacto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "rol")
    private String rol;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "whatsapp")
    private String whatsapp;

    @Column(name = "correo")
    private String correo;

    @Column(name = "notas", length = 2000)
    private String notas;

    @Column(name = "contacto_principal")
    private Boolean contactoPrincipal = false;

    @Column(name = "estado_contacto")
    private String estadoContacto = "ACTIVO";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
