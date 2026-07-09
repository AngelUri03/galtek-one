package com.galtekone.entity;

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
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ProveedorActivoEvidencia")
@Getter
@Setter
public class ProveedorActivoEvidenciaEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_activo_evidencia")
    private Integer idProveedorActivoEvidencia;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor_activo_historial", nullable = false)
    private ProveedorActivoHistorialEntity historial;

    @Column(name = "evidencia_nombre")
    private String evidenciaNombre;

    @Column(name = "evidencia_mime_type")
    private String evidenciaMimeType;

    @Lob
    @Column(name = "evidencia_base64", columnDefinition = "TEXT")
    private String evidenciaBase64;

    @Column(name = "evidencia_tamano_bytes")
    private Long evidenciaTamanoBytes;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;
}
