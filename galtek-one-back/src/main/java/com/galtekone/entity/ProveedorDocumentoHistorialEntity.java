package com.galtekone.entity;

import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ProveedorDocumentoHistorial")
@Getter
@Setter
public class ProveedorDocumentoHistorialEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_documento_historial")
    private Integer idProveedorDocumentoHistorial;

    @Column(name = "id_proveedor_documento", nullable = false)
    private Integer idProveedorDocumento;

    @Column(name = "id_proveedor", nullable = false)
    private Integer idProveedor;

    @Column(name = "tipo_evento", nullable = false)
    private String tipoEvento;

    @Column(name = "descripcion", length = 2000)
    private String descripcion;

    @Column(name = "detalle_anterior", length = 4000)
    private String detalleAnterior;

    @Column(name = "detalle_nuevo", length = 4000)
    private String detalleNuevo;

    @Column(name = "fecha_evento")
    private LocalDateTime fechaEvento;

    @Column(name = "archivo_anterior_nombre")
    private String archivoAnteriorNombre;

    @Column(name = "archivo_anterior_mime_type")
    private String archivoAnteriorMimeType;

    @Column(name = "archivo_anterior_tamano_bytes")
    private Long archivoAnteriorTamanoBytes;

    @Lob
    @Column(name = "archivo_anterior_base64", columnDefinition = "TEXT")
    private String archivoAnteriorBase64;

    @Column(name = "archivo_nuevo_nombre")
    private String archivoNuevoNombre;

    @Column(name = "archivo_nuevo_mime_type")
    private String archivoNuevoMimeType;

    @Column(name = "archivo_nuevo_tamano_bytes")
    private Long archivoNuevoTamanoBytes;

    @Lob
    @Column(name = "archivo_nuevo_base64", columnDefinition = "TEXT")
    private String archivoNuevoBase64;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
