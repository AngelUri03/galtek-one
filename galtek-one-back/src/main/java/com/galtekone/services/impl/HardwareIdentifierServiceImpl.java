package com.galtekone.services.impl;

import com.galtekone.dto.device.HardwareHashes;
import com.galtekone.services.HardwareIdentifierService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.ComputerSystem;
import oshi.hardware.HWDiskStore;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Service
@Profile("desktop")
public class HardwareIdentifierServiceImpl implements HardwareIdentifierService {

    @Override
    public HardwareHashes getCurrentHardwareHashes() {
        SystemInfo si = new SystemInfo();
        HardwareAbstractionLayer hal = si.getHardware();

        String cpuSerial = getCpuSerial(hal.getProcessor());
        String motherboardSerial = getMotherboardSerial(hal.getComputerSystem());
        String macAddress = getMacAddress(hal.getNetworkIFs());
        String diskSerial = getDiskSerial(hal.getDiskStores());

        return new HardwareHashes(
                hashString(cpuSerial),
                hashString(motherboardSerial),
                hashString(macAddress),
                hashString(diskSerial)
        );
    }

    private String getCpuSerial(CentralProcessor processor) {
        String id = processor.getProcessorIdentifier().getProcessorID();
        return isValidSerial(id) ? id : "UNKNOWN_CPU";
    }

    private String getMotherboardSerial(ComputerSystem cs) {
        String serial = cs.getBaseboard().getSerialNumber();
        return isValidSerial(serial) ? serial : "UNKNOWN_MOTHERBOARD";
    }

    private String getMacAddress(List<NetworkIF> networkIFs) {
        for (NetworkIF net : networkIFs) {
            // Filtrar interfaces virtuales, loopback o desconectadas
            String mac = net.getMacaddr();
            String name = net.getName().toLowerCase();
            
            if (mac != null && !mac.isEmpty() && !mac.equals("00:00:00:00:00:00") &&
                    !name.contains("virtual") && !name.contains("vmware") && !name.contains("vbox") &&
                    net.getBytesRecv() > 0 && net.getBytesSent() > 0) {
                return mac;
            }
        }
        return "UNKNOWN_MAC";
    }

    private String getDiskSerial(List<HWDiskStore> disks) {
        for (HWDiskStore disk : disks) {
            String serial = disk.getSerial();
            if (isValidSerial(serial) && disk.getSize() > 0) {
                return serial;
            }
        }
        return "UNKNOWN_DISK";
    }

    private boolean isValidSerial(String serial) {
        if (serial == null || serial.trim().isEmpty()) return false;
        String lower = serial.toLowerCase();
        return !lower.contains("to be filled by o.e.m.") && 
               !lower.contains("unknown") && 
               !lower.contains("default string");
    }

    private String hashString(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing hardware component", e);
        }
    }
}
