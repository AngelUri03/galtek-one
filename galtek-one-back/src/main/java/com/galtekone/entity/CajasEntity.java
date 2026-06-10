package com.galtekone.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="Cajas")
@Getter
@Setter
public class CajasEntity extends CommonEntity{
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_caja")
	private Integer idCaja;
	
	@Column(name = "nombre")
	private String nombreCaja;
	
	 @Column(name = "tipo", nullable = false)
	 private String tipo;
	 
	 @ManyToOne
	 @JoinColumn(name = "id_empresa", nullable = false)
	 private EmpresasEntity empresa;
	
	@PrePersist
    @PreUpdate
    private void validarTipo() {
        if (!"Monocaja".equalsIgnoreCase(tipo) && !"Multicaja".equalsIgnoreCase(tipo)) {
            throw new IllegalArgumentException("Tipo de caja inválido. Solo se permite 'Monocaja' o 'Multicaja'");
        }
    }
	
}