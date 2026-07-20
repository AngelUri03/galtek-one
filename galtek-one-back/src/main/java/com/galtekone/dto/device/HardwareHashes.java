package com.galtekone.dto.device;

public record HardwareHashes(
    String cpuHash,
    String motherboardHash,
    String macHash,
    String diskHash
) {}
