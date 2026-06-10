package com.galtekone.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.utils.BaseEmpresa;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MovimientoCaja", indexes = {
        @Index(name = "idx_mov_caja_empresa_fecha", columnList = "id_empresa, fecha"),
        @Index(name = "idx_mov_caja_caja_empresa", columnList = "id_caja, id_empresa")
})
@Getter
@Setter
public class MovimientoCajaEntity extends CommonEntity implements BaseEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento_caja")
    private Integer idMovimientoCaja;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_caja", nullable = false)
    private CajasEntity caja;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuariosEntity usuario;

    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @PrePersist
    @PreUpdate
    private void validarTipo() {
        if (!"INGRESO".equalsIgnoreCase(tipo) && !"EGRESO".equalsIgnoreCase(tipo)) {
            throw new IllegalArgumentException("Tipo de movimiento inválido. Solo se permite 'INGRESO' o 'EGRESO'");
        }
    }
}

