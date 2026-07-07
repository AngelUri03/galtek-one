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
@Table(name = "ProveedorDocumento")
@Getter
@Setter
public class ProveedorDocumentoEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_documento")
    private Integer idProveedorDocumento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor_activo")
    private ProveedorActivoEntity activo;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "ruta_documento")
    private String rutaDocumento;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "descripcion", length = 2000)
    private String descripcion;

    @Column(name = "estado_documento")
    private String estadoDocumento = "ACTIVO";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
