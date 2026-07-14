package com.galtekone.services.impl;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.galtekone.dto.device.HardwareHashes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.device.DeviceIdentityDTO;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.repository.CajasRepository;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.LocalDeviceRepository;
import com.galtekone.crypto.LicenseVerificationService;
import com.galtekone.security.DeviceLockState;
import com.galtekone.services.HardwareIdentifierService;
import com.galtekone.services.LocalDeviceIdentityService;

import jakarta.annotation.PostConstruct;

@Service
@Profile("desktop")
public class LocalDeviceIdentityServiceImpl implements LocalDeviceIdentityService {

    @Autowired
    private LocalDeviceRepository localDeviceRepository;

    @Autowired
    private CajasRepository cajasRepository;

    @Autowired
    private EmpresasRepository empresasRepository;

    private final ObjectMapper objectMapper;

    public LocalDeviceIdentityServiceImpl() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    private File getIdentityFile() {
        File dir = java.nio.file.Paths.get(System.getProperty("user.home"), ".galtek-one").toFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, "installation.json");
    }

    @Autowired
    private HardwareIdentifierService hardwareIdentifierService;

    @Autowired
    private DeviceLockState deviceLockState;

    @Autowired
    private LicenseVerificationService licenseVerificationService;

    @org.springframework.beans.factory.annotation.Value("${app.device.skip-hardware-check:false}")
    private boolean skipHardwareCheck;

    @PostConstruct
    public synchronized void init() {
        File file = getIdentityFile();
        DeviceIdentityDTO fileData = null;

        if (file.exists()) {
            try {
                fileData = objectMapper.readValue(file, DeviceIdentityDTO.class);
                if (fileData.getInstallationId() == null) {
                    fileData = null; // corrupt or invalid format
                }
            } catch (Exception e) {
                fileData = null; // corrupt, ignore
            }
        }

        Optional<LocalDeviceEntity> dbEntityOpt = localDeviceRepository.findAll().stream().findFirst();

        HardwareHashes currentHardware = hardwareIdentifierService.getCurrentHardwareHashes();

        if (dbEntityOpt.isPresent()) {
            LocalDeviceEntity dbEntity = dbEntityOpt.get();

            // 1. Verificacion de Licencia (Firma RSA)
            if (dbEntity.getLicenseToken() == null || dbEntity.getLicenseToken().isBlank()) {
                deviceLockState.setLocked(true);
                deviceLockState.setLockReason("ACTIVATION_REQUIRED");
                
                // Asegurar que guardamos el JSON en caso de que falte
                if (fileData == null) syncToFile(dbEntity, file);
                return;
            }
            
            try {
                licenseVerificationService.verifyLicense(dbEntity.getLicenseToken());
            } catch (Exception e) {
                deviceLockState.setLocked(true);
                deviceLockState.setLockReason("Licencia invalida o corrupta");
                return;
            }

            // Retro-compatibilidad: Si la BD existe pero no tiene hashes (instalacion vieja)
            if (dbEntity.getCpuHash() == null) {
                dbEntity.setCpuHash(currentHardware.cpuHash());
                dbEntity.setMotherboardHash(currentHardware.motherboardHash());
                dbEntity.setMacHash(currentHardware.macHash());
                dbEntity.setDiskHash(currentHardware.diskHash());
                localDeviceRepository.save(dbEntity);
                syncToFile(dbEntity, file);
            } else {
                // Verificar hardware con votación (3 de 4)
                if (!skipHardwareCheck) {
                    int matches = 0;
                    if (currentHardware.cpuHash().equals(dbEntity.getCpuHash()))
                        matches++;
                    if (currentHardware.motherboardHash().equals(dbEntity.getMotherboardHash()))
                        matches++;
                    if (currentHardware.macHash().equals(dbEntity.getMacHash()))
                        matches++;
                    if (currentHardware.diskHash().equals(dbEntity.getDiskHash()))
                        matches++;

                    if (matches < 3) {
                        deviceLockState.setLocked(true);
                        deviceLockState.setLockReason("Fallo de verificacion de hardware (Similitud menor al 75%)");
                    }
                }
            }

            if (fileData == null || !dbEntity.getInstallationId().equals(fileData.getInstallationId())
                    || (dbEntity.getCashRegisterId() != null
                            && !dbEntity.getCashRegisterId().equals(fileData.getCashRegisterId()))) {
                syncToFile(dbEntity, file);
            }
        } else {
            if (fileData != null) {
                // Restore from File to DB
                LocalDeviceEntity newEntity = new LocalDeviceEntity();
                newEntity.setInstallationId(fileData.getInstallationId());
                newEntity.setCashRegisterId(fileData.getCashRegisterId());
                // Asegurarse de restaurar hashes si existen, sino usar actuales
                newEntity.setCpuHash(fileData.getCpuHash() != null ? fileData.getCpuHash() : currentHardware.cpuHash());
                newEntity.setMotherboardHash(fileData.getMotherboardHash() != null ? fileData.getMotherboardHash()
                        : currentHardware.motherboardHash());
                newEntity.setMacHash(fileData.getMacHash() != null ? fileData.getMacHash() : currentHardware.macHash());
                newEntity.setDiskHash(
                        fileData.getDiskHash() != null ? fileData.getDiskHash() : currentHardware.diskHash());
                newEntity.setLicenseToken(fileData.getLicenseToken());
                newEntity.setCreatedAt(fileData.getCreatedAt());
                localDeviceRepository.save(newEntity);

                // 1. Verificar licencia
                if (newEntity.getLicenseToken() == null || newEntity.getLicenseToken().isBlank()) {
                    deviceLockState.setLocked(true);
                    deviceLockState.setLockReason("ACTIVATION_REQUIRED");
                    return;
                }
                
                try {
                    licenseVerificationService.verifyLicense(newEntity.getLicenseToken());
                } catch (Exception e) {
                    deviceLockState.setLocked(true);
                    deviceLockState.setLockReason("Licencia invalida o corrupta");
                    return;
                }

                // 2. Verificar recien restaurado
                if (!skipHardwareCheck && fileData.getCpuHash() != null) {
                    int matches = 0;
                    if (currentHardware.cpuHash().equals(fileData.getCpuHash()))
                        matches++;
                    if (currentHardware.motherboardHash().equals(fileData.getMotherboardHash()))
                        matches++;
                    if (currentHardware.macHash().equals(fileData.getMacHash()))
                        matches++;
                    if (currentHardware.diskHash().equals(fileData.getDiskHash()))
                        matches++;

                    if (matches < 3) {
                        deviceLockState.setLocked(true);
                        deviceLockState.setLockReason("Fallo de verificacion de hardware tras restauracion");
                    }
                }
            } else {
                // Generate completely new identity with hardware hashes
                LocalDeviceEntity newEntity = new LocalDeviceEntity();
                newEntity.setInstallationId(UUID.randomUUID().toString());
                newEntity.setCashRegisterId(null);
                newEntity.setCpuHash(currentHardware.cpuHash());
                newEntity.setMotherboardHash(currentHardware.motherboardHash());
                newEntity.setMacHash(currentHardware.macHash());
                newEntity.setDiskHash(currentHardware.diskHash());

                newEntity = localDeviceRepository.saveAndFlush(newEntity);

                if (newEntity.getCreatedAt() == null) {
                    newEntity.setCreatedAt(LocalDateTime.now());
                }
                syncToFile(newEntity, file);

                deviceLockState.setLocked(true);
                deviceLockState.setLockReason("ACTIVATION_REQUIRED");
            }
        }
    }

    private void syncToFile(LocalDeviceEntity entity, File file) {
        try {
            DeviceIdentityDTO dto = new DeviceIdentityDTO(
                    entity.getInstallationId(),
                    entity.getCashRegisterId(),
                    entity.getCpuHash(),
                    entity.getMotherboardHash(),
                    entity.getMacHash(),
                    entity.getDiskHash(),
                    entity.getLicenseToken(),
                    entity.getCreatedAt(),
                    null,
                    null);
            objectMapper.writeValue(file, dto);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public DeviceIdentityDTO getIdentity() {
        Optional<LocalDeviceEntity> dbEntityOpt = localDeviceRepository.findAll().stream().findFirst();
        if (dbEntityOpt.isPresent()) {
            LocalDeviceEntity entity = dbEntityOpt.get();
            DeviceIdentityDTO dto = new DeviceIdentityDTO(
                    entity.getInstallationId(),
                    entity.getCashRegisterId(),
                    entity.getCpuHash(),
                    entity.getMotherboardHash(),
                    entity.getMacHash(),
                    entity.getDiskHash(),
                    entity.getLicenseToken(),
                    entity.getCreatedAt(),
                    null,
                    null);
            
            if (deviceLockState.isLocked()) {
                try {
                    dto.setLockReason(deviceLockState.getLockReason());
                    String json = objectMapper.writeValueAsString(dto);
                    String base64 = java.util.Base64.getEncoder().encodeToString(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    dto.setMachineCodeBase64(base64);
                } catch (Exception e) {}
            }
            return dto;
        }
        return null;
    }

    @Override
    @Transactional
    public synchronized void registerDevice(String name, String user) {
        Optional<LocalDeviceEntity> dbEntityOpt = localDeviceRepository.findAll().stream().findFirst();
        if (dbEntityOpt.isEmpty()) {
            throw new IllegalStateException("Dispositivo local no inicializado.");
        }

        LocalDeviceEntity localDevice = dbEntityOpt.get();
        if (localDevice.getCashRegisterId() != null) {
            throw new IllegalStateException("Este dispositivo ya esta registrado como una caja.");
        }

        Integer idEmpresa = EmpresaContextHolder.getEmpresaId();
        if (idEmpresa == null) {
            throw new IllegalStateException("No se encontro un idEmpresa en el contexto.");
        }

        EmpresasEntity empresa = empresasRepository.findById(idEmpresa)
                .orElseThrow(() -> new IllegalStateException("Empresa no encontrada"));

        CajasEntity caja = new CajasEntity();
        caja.setNombreCaja(name);
        caja.setTipo("Monocaja");
        caja.setEmpresa(empresa);
        caja.setUsuarioCreacion(user);

        caja = cajasRepository.save(caja);

        localDevice.setCashRegisterId(caja.getIdCaja());
        localDeviceRepository.save(localDevice);

        syncToFile(localDevice, getIdentityFile());
    }

    @Override
    @Transactional
    public synchronized void activateDevice(String token) {
        Optional<LocalDeviceEntity> dbEntityOpt = localDeviceRepository.findAll().stream().findFirst();
        if (dbEntityOpt.isPresent()) {
            LocalDeviceEntity dbEntity = dbEntityOpt.get();
            
            io.jsonwebtoken.Claims claims;
            try {
                claims = licenseVerificationService.verifyLicense(token);
            } catch (Exception e) {
                throw new IllegalArgumentException(e.getMessage());
            }

            // Votacion 3 de 4 contra hardware fisico (Evita transplante de token)
            HardwareHashes currentHardware = hardwareIdentifierService.getCurrentHardwareHashes();
            int matches = 0;
            if (currentHardware.cpuHash().equals(claims.get("cpuHash", String.class))) matches++;
            if (currentHardware.motherboardHash().equals(claims.get("motherboardHash", String.class))) matches++;
            if (currentHardware.macHash().equals(claims.get("macHash", String.class))) matches++;
            if (currentHardware.diskHash().equals(claims.get("diskHash", String.class))) matches++;

            if (matches < 3) {
                throw new IllegalArgumentException("Token invalido: El hardware no corresponde a la licencia original.");
            }

            Integer savedCashRegisterId = dbEntity.getCashRegisterId();
            
            // Recrear entidad para actualizar UUID
            localDeviceRepository.deleteAll();
            localDeviceRepository.flush();
            
            LocalDeviceEntity newEntity = new LocalDeviceEntity();
            newEntity.setInstallationId(claims.getSubject());
            newEntity.setCashRegisterId(savedCashRegisterId);
            
            newEntity.setCpuHash(claims.get("cpuHash", String.class));
            newEntity.setMotherboardHash(claims.get("motherboardHash", String.class));
            newEntity.setMacHash(claims.get("macHash", String.class));
            newEntity.setDiskHash(claims.get("diskHash", String.class));
            
            newEntity.setLicenseToken(token);
            newEntity.setCreatedAt(java.time.LocalDateTime.now());
            
            localDeviceRepository.saveAndFlush(newEntity);
            syncToFile(newEntity, getIdentityFile());
            
            deviceLockState.setLocked(false);
            deviceLockState.setLockReason("");
        } else {
            throw new IllegalStateException("No hay un dispositivo local inicializado para activar.");
        }
    }
}
