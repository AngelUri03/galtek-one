package com.galtekone.services;

import org.springframework.stereotype.Service;

import com.galtekone.entity.CajaSesionEntity;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CajaOperacionGuard {

    private final CajaSesionService cajaSesionService;

    public CajaSesionEntity requireOpenSessionForSale(String user, Integer ignoredLegacyCajaId) {
        return cajaSesionService.requireOpenSessionForCurrentInstallation(user, ignoredLegacyCajaId);
    }
}
