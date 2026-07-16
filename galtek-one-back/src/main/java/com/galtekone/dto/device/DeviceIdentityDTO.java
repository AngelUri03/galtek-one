package com.galtekone.dto.device;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeviceIdentityDTO {
    private String installationId;
    private Integer cashRegisterId;
    
    private String cpuHash;
    private String motherboardHash;
    private String macHash;
    private String diskHash;
    
    private String licenseToken;

    private LocalDateTime createdAt;
    
    private String machineCodeBase64;
    
    private String lockReason;
}
