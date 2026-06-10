package com.galtekone.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Getter
@Setter
public class CommonEntity {

	@Column(name = "fecha_creacion", updatable = false)
    @CreationTimestamp
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_modificacion")
    @UpdateTimestamp
    private LocalDateTime fechaModificacion;

    @Column(name = "estatus")
    private Boolean estatus = true;

    @Column(name = "usuario_creacion", updatable = false)
    private String usuarioCreacion;

    @Column(name = "usuario_modificacion")
    private String usuarioModificacion;
	
}
