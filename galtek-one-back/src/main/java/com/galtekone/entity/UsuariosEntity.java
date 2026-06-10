package com.galtekone.entity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
@Table(name = "Usuarios")
@Getter
@Setter
public class UsuariosEntity extends CommonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "nombre_usuario")
    private String nombreUsuario;

    @Column(name = "usuario", nullable = false)
    private String usuario;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "correo_usuario")
    private String correo;

    @Column(name = "telefono_usuario", nullable = false)
    private String telefono;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_rol", nullable = false)
    private RolesEntity rol;

    @ManyToOne
    @JoinColumn(name = "id_empresa", nullable = false)
    private EmpresasEntity empresa;

    @Column(name = "activo", nullable = false)
    private Integer activo;
    
    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;
    
    @PrePersist
    @PreUpdate
    private void hashPassword() {
        if (password != null && !password.startsWith("$2a$") && !password.startsWith("$2b$")) {
            this.password = new BCryptPasswordEncoder().encode(this.password);
        }
    }
}
