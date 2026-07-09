package com.galtekone.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ProveedorActivoHistorial")
@Getter
@Setter
public class ProveedorActivoHistorialEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_activo_historial")
    private Integer idProveedorActivoHistorial;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor_activo", nullable = false)
    private ProveedorActivoEntity activo;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private ProveedoresEntity proveedor;

    @Column(name = "tipo_evento", nullable = false)
    private String tipoEvento;

    @Column(name = "estado_anterior")
    private String estadoAnterior;

    @Column(name = "estado_nuevo")
    private String estadoNuevo;

    @Column(name = "descripcion", length = 2000)
    private String descripcion;

    @Column(name = "detalle_anterior", length = 4000)
    private String detalleAnterior;

    @Column(name = "detalle_nuevo", length = 4000)
    private String detalleNuevo;

    @Column(name = "fecha_evento")
    private LocalDateTime fechaEvento;

    @Column(name = "evidencia_nombre")
    private String evidenciaNombre;

    @Column(name = "evidencia_mime_type")
    private String evidenciaMimeType;

    @Lob
    @Column(name = "evidencia_base64", columnDefinition = "TEXT")
    private String evidenciaBase64;

    @Column(name = "evidencia_tamano_bytes")
    private Long evidenciaTamanoBytes;

    @Transient
    private List<ProveedorActivoEvidenciaEntity> evidencias = new ArrayList<>();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
