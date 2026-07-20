package com.galtekone.services;

import com.galtekone.dto.device.DeviceIdentityDTO;

public interface LocalDeviceIdentityService {
    DeviceIdentityDTO getIdentity();
    void registerDevice(String name, String user);
    void activateDevice(String token);
}
