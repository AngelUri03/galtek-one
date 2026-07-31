package com.galtekone.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "LocalDevice")
@Getter
@Setter
public class LocalDeviceEntity {

    @Id
    @Column(name = "installation_id", nullable = false, length = 36)
    private String installationId;

    @Column(name = "cash_register_id")
    @Deprecated
    private Integer cashRegisterId;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(name = "cpu_hash", length = 64)
    private String cpuHash;

    @Column(name = "motherboard_hash", length = 64)
    private String motherboardHash;

    @Column(name = "mac_hash", length = 64)
    private String macHash;

    @Column(name = "disk_hash", length = 64)
    private String diskHash;

    @Column(name = "license_token", length = 2500)
    private String licenseToken;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_empresa")
    private EmpresasEntity empresa;
}
