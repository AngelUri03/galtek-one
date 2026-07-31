package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.pagos.ConfiguracionPagosDTO;
import com.galtekone.dto.pagos.MetodoPagoConfigDTO;
import com.galtekone.dto.pagos.TerminalPagoConfigDTO;
import com.galtekone.entity.ConfiguracionPagosEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.MetodoPagoEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.ConfiguracionPagosRepository;
import com.galtekone.repository.MetodoPagoRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.ConfiguracionPagosService;
import com.galtekone.utils.CajaOperacionException;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfiguracionPagosServiceImpl implements ConfiguracionPagosService {

    private static final Set<String> TIPOS = Set.of("CASH", "TERMINAL", "CARD", "VOUCHER");
    private static final Set<String> FIXED_CODES = Set.of("TERMINAL", "EFECTIVO", "TARJETA", "VALES");
    private static final Set<String> PROVIDERS = Set.of("MERCADO_PAGO", "CLIP", "CONEKTA", "BANCO");
    private static final BigDecimal ZERO_PERCENT = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
    private static final TypeReference<List<TerminalPagoConfigDTO>> TERMINAL_LIST_TYPE = new TypeReference<>() {};

    private final ConfiguracionPagosRepository configuracionPagosRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final UsuariosRepository usuariosRepository;
    private final CajaPermisosResolver permisosResolver;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ConfiguracionPagosDTO getConfiguracion(String user) {
        Integer empresaId = requireEmpresaId();
        findUsuario(user, empresaId);
        ConfiguracionPagosEntity entity = getOrCreate(empresaId, user);
        ensureFixedMethods(empresaId, user, false);
        hideUnsupportedMethods(empresaId, user);
        return toDTO(entity, readFixedMethods(empresaId));
    }

    @Override
    @Transactional
    public ConfiguracionPagosDTO updateConfiguracion(ConfiguracionPagosDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CONFIG_PAGOS_EDITAR")) {
            throw new CajaOperacionException("PAYMENTS_CONFIG_FORBIDDEN",
                    "El usuario no tiene permiso para modificar pagos y terminal.", HttpStatus.FORBIDDEN);
        }
        if (request == null) {
            throw new IllegalArgumentException("La configuracion de pagos es obligatoria.");
        }

        ConfiguracionPagosEntity entity = getOrCreate(empresaId, user);
        applyConfig(entity, request);
        entity.setUsuarioModificacion(user);
        ConfiguracionPagosEntity saved = configuracionPagosRepository.save(entity);

        if (request.getMetodosPago() != null) {
            updateFixedMethods(empresaId, request.getMetodosPago(), user);
        }
        ensureFixedMethods(empresaId, user, false);
        hideUnsupportedMethods(empresaId, user);
        ensureAtLeastOneActiveMethod(empresaId);
        ensureTerminalConsistency(saved, empresaId);

        return toDTO(saved, readFixedMethods(empresaId));
    }

    @Override
    @Transactional
    public ConfiguracionPagosEntity getOrCreate(Integer empresaId, String user) {
        return configuracionPagosRepository.findByEmpresa_IdEmpresaAndEstatusTrue(empresaId)
                .orElseGet(() -> {
                    ConfiguracionPagosEntity entity = defaultConfig(empresaId, user);
                    entity.setTerminalesJson(writeTerminals(defaultTerminals(entity)));
                    ConfiguracionPagosEntity saved = configuracionPagosRepository.save(entity);
                    ensureFixedMethods(empresaId, user, true);
                    hideUnsupportedMethods(empresaId, user);
                    return saved;
                });
    }

    @Override
    public List<TerminalPagoConfigDTO> getTerminales(ConfiguracionPagosEntity configuracion) {
        return readTerminals(configuracion);
    }

    @Override
    public TerminalPagoConfigDTO resolveTerminal(ConfiguracionPagosEntity configuracion, String terminalKey) {
        List<TerminalPagoConfigDTO> active = readTerminals(configuracion).stream()
                .filter(terminal -> terminal.getEnabled() == null || Boolean.TRUE.equals(terminal.getEnabled()))
                .toList();
        if (active.isEmpty()) {
            throw new IllegalArgumentException("Configura al menos una terminal activa antes de cobrar por terminal.");
        }

        String requestedKey = cleanKey(terminalKey);
        if (requestedKey == null) {
            return active.get(0);
        }

        return active.stream()
                .filter(terminal -> requestedKey.equals(cleanKey(terminal.getKey())))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La terminal seleccionada no esta activa."));
    }

    private ConfiguracionPagosEntity defaultConfig(Integer empresaId, String user) {
        ConfiguracionPagosEntity entity = new ConfiguracionPagosEntity();
        entity.setEmpresa(empresaRef(empresaId));
        entity.setTerminalEnabled(true);
        entity.setTerminalProvider("MERCADO_PAGO");
        entity.setTerminalName("Mercado Pago");
        entity.setTerminalPriority(1);
        entity.setTerminalCommissionEnabled(true);
        entity.setTerminalCommissionPercent(ZERO_PERCENT);
        entity.setTerminalRequireReference(true);
        entity.setCashRoundingDefaultEnabled(true);
        entity.setVoucherRequireFolio(true);
        entity.setVoucherRequireAuthorization(true);
        entity.setUsuarioCreacion(user);
        entity.setEstatus(true);
        return entity;
    }

    private void applyConfig(ConfiguracionPagosEntity entity, ConfiguracionPagosDTO request) {
        if (request.getTerminalEnabled() != null) {
            entity.setTerminalEnabled(request.getTerminalEnabled());
        }
        if (request.getTerminalProvider() != null) {
            entity.setTerminalProvider(normalizeChoice(request.getTerminalProvider(), PROVIDERS, "MERCADO_PAGO"));
        }
        if (request.getTerminalName() != null) {
            entity.setTerminalName(cleanText(request.getTerminalName(), 120));
        }
        if (request.getTerminalIdentifier() != null) {
            entity.setTerminalIdentifier(cleanText(request.getTerminalIdentifier(), 120));
        }
        if (request.getTerminalSerial() != null) {
            entity.setTerminalSerial(cleanText(request.getTerminalSerial(), 120));
        }
        if (request.getTerminalStoreId() != null) {
            entity.setTerminalStoreId(cleanText(request.getTerminalStoreId(), 120));
        }
        if (request.getTerminalAccount() != null) {
            entity.setTerminalAccount(cleanText(request.getTerminalAccount(), 160));
        }
        if (request.getTerminalCommissionEnabled() != null) {
            entity.setTerminalCommissionEnabled(request.getTerminalCommissionEnabled());
        }
        if (request.getTerminalCommissionPercent() != null) {
            entity.setTerminalCommissionPercent(normalizePercent(request.getTerminalCommissionPercent()));
        }
        if (request.getTerminalRequireReference() != null) {
            entity.setTerminalRequireReference(request.getTerminalRequireReference());
        }
        if (request.getCashRoundingDefaultEnabled() != null) {
            entity.setCashRoundingDefaultEnabled(request.getCashRoundingDefaultEnabled());
        }
        if (request.getCardBankName() != null) {
            entity.setCardBankName(cleanText(request.getCardBankName(), 120));
        }
        if (request.getCardHolderName() != null) {
            entity.setCardHolderName(cleanText(request.getCardHolderName(), 160));
        }
        if (request.getCardNumber() != null) {
            entity.setCardNumber(cleanText(request.getCardNumber(), 40));
        }
        if (request.getCardAccount() != null) {
            entity.setCardAccount(cleanText(request.getCardAccount(), 60));
        }
        if (request.getCardInstructions() != null) {
            entity.setCardInstructions(cleanText(request.getCardInstructions(), 220));
        }
        if (request.getVoucherIssuer() != null) {
            entity.setVoucherIssuer(cleanText(request.getVoucherIssuer(), 120));
        }
        if (request.getVoucherInstructions() != null) {
            entity.setVoucherInstructions(cleanText(request.getVoucherInstructions(), 220));
        }
        if (request.getVoucherRequireFolio() != null) {
            entity.setVoucherRequireFolio(request.getVoucherRequireFolio());
        }
        if (request.getVoucherRequireAuthorization() != null) {
            entity.setVoucherRequireAuthorization(request.getVoucherRequireAuthorization());
        }

        List<TerminalPagoConfigDTO> terminales = request.getTerminales() == null
                ? readTerminals(entity)
                : normalizeTerminals(request.getTerminales(), entity);
        entity.setTerminalesJson(writeTerminals(terminales));
        syncLegacyTerminalFields(entity, terminales);
    }

    private void updateFixedMethods(Integer empresaId, List<MetodoPagoConfigDTO> methods, String user) {
        Map<String, MetodoPagoConfigDTO> byCode = new LinkedHashMap<>();
        for (MetodoPagoConfigDTO dto : methods) {
            String code = normalizeCode(firstNonBlank(dto.getCodigo(), dto.getNombre(), dto.getNombreMetodoPago()));
            if (code != null && FIXED_CODES.contains(code)) {
                byCode.put(code, dto);
            }
        }

        for (PaymentMethodSeed seed : paymentSeeds()) {
            MetodoPagoEntity method = findMethodBySeed(empresaId, seed)
                    .orElseGet(() -> {
                        MetodoPagoEntity created = new MetodoPagoEntity();
                        created.setEmpresa(empresaRef(empresaId));
                        created.setUsuarioCreacion(user);
                        return created;
                    });
            MetodoPagoConfigDTO dto = byCode.get(seed.code());
            method.setNombreMetodoPago(seed.name());
            method.setCodigo(seed.code());
            method.setTipo(seed.type());
            method.setOrden(seed.order());
            method.setVisiblePos(true);
            method.setRequiereReferencia(seed.reference());
            method.setRequiereVerificacion(seed.verify());
            if (dto != null && dto.getEstatus() != null) {
                method.setEstatus(dto.getEstatus());
            } else if (method.getEstatus() == null) {
                method.setEstatus(seed.active());
            }
            method.setUsuarioModificacion(user);
            metodoPagoRepository.save(method);
        }
    }

    private void ensureFixedMethods(Integer empresaId, String user, boolean firstConfig) {
        for (PaymentMethodSeed seed : paymentSeeds()) {
            MetodoPagoEntity method = findMethodBySeed(empresaId, seed)
                    .orElseGet(() -> {
                        MetodoPagoEntity created = new MetodoPagoEntity();
                        created.setEmpresa(empresaRef(empresaId));
                        created.setUsuarioCreacion(user);
                        return created;
                    });

            method.setNombreMetodoPago(seed.name());
            method.setCodigo(seed.code());
            method.setTipo(seed.type());
            method.setOrden(seed.order());
            method.setVisiblePos(true);
            method.setRequiereReferencia(seed.reference());
            method.setRequiereVerificacion(seed.verify());
            if (method.getEstatus() == null || (firstConfig && !seed.active())) {
                method.setEstatus(seed.active());
            }
            method.setUsuarioModificacion(user);
            metodoPagoRepository.save(method);
        }
    }

    private void hideUnsupportedMethods(Integer empresaId, String user) {
        for (MetodoPagoEntity method : readAllMethods(empresaId)) {
            String code = normalizeCode(firstNonBlank(method.getCodigo(), method.getNombreMetodoPago()));
            if (code != null && FIXED_CODES.contains(code)) {
                continue;
            }
            method.setEstatus(false);
            method.setVisiblePos(false);
            method.setUsuarioModificacion(user);
            metodoPagoRepository.save(method);
        }
    }

    private Optional<MetodoPagoEntity> findMethodBySeed(Integer empresaId, PaymentMethodSeed seed) {
        Optional<MetodoPagoEntity> byCode =
                metodoPagoRepository.findFirstByEmpresa_IdEmpresaAndCodigoIgnoreCase(empresaId, seed.code());
        if (byCode.isPresent()) {
            return byCode;
        }

        if ("TERMINAL".equals(seed.code())) {
            Optional<MetodoPagoEntity> legacyTerminal = readAllMethods(empresaId).stream()
                    .filter(method -> "TERMINAL".equals(normalizeType(firstNonBlank(method.getTipo(), method.getCodigo()))))
                    .findFirst();
            if (legacyTerminal.isPresent()) {
                return legacyTerminal;
            }
        }

        return metodoPagoRepository.findFirstByEmpresa_IdEmpresaAndNombreMetodoPagoIgnoreCase(empresaId, seed.name());
    }

    private void ensureAtLeastOneActiveMethod(Integer empresaId) {
        boolean hasActive = readFixedMethods(empresaId).stream()
                .anyMatch(method -> Boolean.TRUE.equals(method.getEstatus())
                        && !Boolean.FALSE.equals(method.getVisiblePos()));
        if (!hasActive) {
            throw new IllegalArgumentException("Debe quedar al menos un metodo de pago activo para el POS.");
        }
    }

    private void ensureTerminalConsistency(ConfiguracionPagosEntity config, Integer empresaId) {
        boolean terminalMethodActive = readFixedMethods(empresaId).stream()
                .anyMatch(method -> "TERMINAL".equals(normalizeType(method.getTipo()))
                        && Boolean.TRUE.equals(method.getEstatus()));
        if (terminalMethodActive && Boolean.TRUE.equals(config.getTerminalEnabled())) {
            boolean hasTerminal = readTerminals(config).stream()
                    .anyMatch(terminal -> terminal.getEnabled() == null || Boolean.TRUE.equals(terminal.getEnabled()));
            if (!hasTerminal) {
                throw new IllegalArgumentException("Deja al menos una terminal activa o desactiva el metodo Terminal.");
            }
        }
    }

    private List<MetodoPagoEntity> readAllMethods(Integer empresaId) {
        List<MetodoPagoEntity> methods =
                new ArrayList<>(metodoPagoRepository.findByEmpresa_IdEmpresaOrderByOrdenAscIdMetodoPagoAsc(empresaId));
        methods.sort(Comparator
                .comparing((MetodoPagoEntity method) -> method.getOrden() == null ? 999 : method.getOrden())
                .thenComparing(method -> method.getNombreMetodoPago() == null ? "" : method.getNombreMetodoPago()));
        return methods;
    }

    private List<MetodoPagoEntity> readFixedMethods(Integer empresaId) {
        return readAllMethods(empresaId).stream()
                .filter(method -> {
                    String code = normalizeCode(firstNonBlank(method.getCodigo(), method.getNombreMetodoPago()));
                    return code != null && FIXED_CODES.contains(code);
                })
                .toList();
    }

    private ConfiguracionPagosDTO toDTO(ConfiguracionPagosEntity entity, List<MetodoPagoEntity> methods) {
        List<TerminalPagoConfigDTO> terminales = readTerminals(entity);

        ConfiguracionPagosDTO dto = new ConfiguracionPagosDTO();
        dto.setIdConfiguracionPagos(entity.getIdConfiguracionPagos());
        dto.setTerminalEnabled(Boolean.TRUE.equals(entity.getTerminalEnabled()));
        dto.setTerminales(terminales);
        dto.setTerminalProvider(defaultIfBlank(entity.getTerminalProvider(), "MERCADO_PAGO"));
        dto.setTerminalName(defaultIfBlank(entity.getTerminalName(), "Mercado Pago"));
        dto.setTerminalIdentifier(entity.getTerminalIdentifier());
        dto.setTerminalSerial(entity.getTerminalSerial());
        dto.setTerminalStoreId(entity.getTerminalStoreId());
        dto.setTerminalAccount(entity.getTerminalAccount());
        dto.setTerminalPriority(1);
        dto.setTerminalCommissionEnabled(Boolean.TRUE.equals(entity.getTerminalCommissionEnabled()));
        dto.setTerminalCommissionPercent(entity.getTerminalCommissionPercent() == null
                ? ZERO_PERCENT
                : entity.getTerminalCommissionPercent().setScale(4, RoundingMode.HALF_UP));
        dto.setTerminalRequireReference(entity.getTerminalRequireReference() == null
                || Boolean.TRUE.equals(entity.getTerminalRequireReference()));
        dto.setCashRoundingDefaultEnabled(entity.getCashRoundingDefaultEnabled() == null
                || Boolean.TRUE.equals(entity.getCashRoundingDefaultEnabled()));
        dto.setCardBankName(entity.getCardBankName());
        dto.setCardHolderName(entity.getCardHolderName());
        dto.setCardNumber(entity.getCardNumber());
        dto.setCardAccount(entity.getCardAccount());
        dto.setCardInstructions(entity.getCardInstructions());
        dto.setVoucherIssuer(entity.getVoucherIssuer());
        dto.setVoucherInstructions(entity.getVoucherInstructions());
        dto.setVoucherRequireFolio(entity.getVoucherRequireFolio() == null
                || Boolean.TRUE.equals(entity.getVoucherRequireFolio()));
        dto.setVoucherRequireAuthorization(entity.getVoucherRequireAuthorization() == null
                || Boolean.TRUE.equals(entity.getVoucherRequireAuthorization()));
        dto.setTransferBankName(entity.getTransferBankName());
        dto.setTransferAccountName(entity.getTransferAccountName());
        dto.setTransferClabe(entity.getTransferClabe());
        dto.setMetodosPago(methods.stream().map(method -> toMethodDTO(method, dto)).toList());
        return dto;
    }

    private MetodoPagoConfigDTO toMethodDTO(MetodoPagoEntity method, ConfiguracionPagosDTO config) {
        MetodoPagoConfigDTO dto = new MetodoPagoConfigDTO();
        String type = normalizeType(firstNonBlank(method.getTipo(), method.getCodigo(), method.getNombreMetodoPago()));
        dto.setIdMetodoPago(method.getIdMetodoPago());
        dto.setNombre(method.getNombreMetodoPago());
        dto.setNombreMetodoPago(method.getNombreMetodoPago());
        dto.setCodigo(defaultIfBlank(method.getCodigo(), normalizeCode(method.getNombreMetodoPago())));
        dto.setTipo(type);
        dto.setOrden(method.getOrden());
        dto.setEstatus(Boolean.TRUE.equals(method.getEstatus()));
        dto.setVisiblePos(method.getVisiblePos() == null || Boolean.TRUE.equals(method.getVisiblePos()));
        dto.setRequiereReferencia(method.getRequiereReferencia() == null
                ? defaultRequiresReference(type)
                : method.getRequiereReferencia());
        dto.setRequiereVerificacion(method.getRequiereVerificacion() == null
                ? defaultRequiresVerification(type)
                : method.getRequiereVerificacion());
        if ("TERMINAL".equals(type)) {
            dto.setComisionPorcentaje(Boolean.TRUE.equals(config.getTerminalCommissionEnabled())
                    ? config.getTerminalCommissionPercent()
                    : ZERO_PERCENT);
            dto.setTerminalProvider(config.getTerminalProvider());
            dto.setTerminalNombre(config.getTerminalName());
        }
        if ("CARD".equals(type)) {
            dto.setCuentaDestino(firstNonBlank(config.getCardBankName(), config.getCardNumber(), config.getCardAccount()));
        }
        return dto;
    }

    private List<TerminalPagoConfigDTO> readTerminals(ConfiguracionPagosEntity entity) {
        if (entity == null) {
            return List.of();
        }
        if (entity.getTerminalesJson() != null && !entity.getTerminalesJson().isBlank()) {
            try {
                List<TerminalPagoConfigDTO> parsed =
                        objectMapper.readValue(entity.getTerminalesJson(), TERMINAL_LIST_TYPE);
                return normalizeTerminals(parsed, entity);
            } catch (Exception ignored) {
                return defaultTerminals(entity);
            }
        }
        return defaultTerminals(entity);
    }

    private List<TerminalPagoConfigDTO> normalizeTerminals(List<TerminalPagoConfigDTO> requested,
            ConfiguracionPagosEntity fallback) {
        List<TerminalPagoConfigDTO> normalized = new ArrayList<>();
        List<TerminalPagoConfigDTO> source = requested == null || requested.isEmpty()
                ? defaultTerminals(fallback)
                : requested;

        int limit = Math.min(source.size(), 3);
        for (int index = 0; index < limit; index += 1) {
            TerminalPagoConfigDTO input = source.get(index);
            TerminalPagoConfigDTO terminal = new TerminalPagoConfigDTO();
            terminal.setKey(defaultIfBlank(cleanKey(input.getKey()), "terminal_" + (index + 1)));
            terminal.setProvider(normalizeChoice(input.getProvider(), PROVIDERS, "MERCADO_PAGO"));
            terminal.setNombre(defaultIfBlank(cleanText(input.getNombre(), 120), providerLabel(terminal.getProvider())));
            terminal.setIdentifier(cleanText(input.getIdentifier(), 120));
            terminal.setSerial(cleanText(input.getSerial(), 120));
            terminal.setStoreId(cleanText(input.getStoreId(), 120));
            terminal.setAccount(cleanText(input.getAccount(), 160));
            terminal.setEnabled(input.getEnabled() == null || Boolean.TRUE.equals(input.getEnabled()));
            terminal.setCommissionEnabled(input.getCommissionEnabled() == null
                    ? fallback == null || Boolean.TRUE.equals(fallback.getTerminalCommissionEnabled())
                    : input.getCommissionEnabled());
            terminal.setCommissionPercent(input.getCommissionPercent() == null
                    ? fallbackPercent(fallback)
                    : normalizePercent(input.getCommissionPercent()));
            normalized.add(terminal);
        }

        if (normalized.isEmpty()) {
            return defaultTerminals(fallback);
        }
        return normalized;
    }

    private List<TerminalPagoConfigDTO> defaultTerminals(ConfiguracionPagosEntity entity) {
        TerminalPagoConfigDTO terminal = new TerminalPagoConfigDTO();
        terminal.setKey("terminal_1");
        terminal.setProvider(defaultIfBlank(entity != null ? entity.getTerminalProvider() : null, "MERCADO_PAGO"));
        terminal.setNombre(defaultIfBlank(entity != null ? entity.getTerminalName() : null, "Mercado Pago"));
        terminal.setIdentifier(entity != null ? entity.getTerminalIdentifier() : null);
        terminal.setSerial(entity != null ? entity.getTerminalSerial() : null);
        terminal.setStoreId(entity != null ? entity.getTerminalStoreId() : null);
        terminal.setAccount(entity != null ? entity.getTerminalAccount() : null);
        terminal.setEnabled(true);
        terminal.setCommissionEnabled(entity == null || Boolean.TRUE.equals(entity.getTerminalCommissionEnabled()));
        terminal.setCommissionPercent(fallbackPercent(entity));
        return List.of(terminal);
    }

    private String writeTerminals(List<TerminalPagoConfigDTO> terminales) {
        try {
            return objectMapper.writeValueAsString(terminales == null ? List.of() : terminales);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("No se pudo guardar la configuracion de terminales.", ex);
        }
    }

    private void syncLegacyTerminalFields(ConfiguracionPagosEntity entity, List<TerminalPagoConfigDTO> terminales) {
        TerminalPagoConfigDTO primary = terminales.stream()
                .filter(terminal -> terminal.getEnabled() == null || Boolean.TRUE.equals(terminal.getEnabled()))
                .findFirst()
                .orElse(terminales.isEmpty() ? null : terminales.get(0));
        if (primary == null) {
            return;
        }
        entity.setTerminalProvider(primary.getProvider());
        entity.setTerminalName(primary.getNombre());
        entity.setTerminalIdentifier(primary.getIdentifier());
        entity.setTerminalSerial(primary.getSerial());
        entity.setTerminalStoreId(primary.getStoreId());
        entity.setTerminalAccount(primary.getAccount());
        entity.setTerminalCommissionEnabled(primary.getCommissionEnabled());
        entity.setTerminalCommissionPercent(primary.getCommissionPercent() == null ? ZERO_PERCENT : primary.getCommissionPercent());
    }

    private Integer requireEmpresaId() {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        if (empresaId == null) {
            throw new CajaOperacionException("PAYMENTS_COMPANY_CONTEXT_MISSING",
                    "No se encontro empresa activa en la sesion.", HttpStatus.UNAUTHORIZED);
        }
        return empresaId;
    }

    private UsuariosEntity findUsuario(String user, Integer empresaId) {
        if (user == null || user.isBlank()) {
            throw new CajaOperacionException("PAYMENTS_USER_CONTEXT_MISSING",
                    "No se encontro usuario autenticado.", HttpStatus.UNAUTHORIZED);
        }
        return usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new CajaOperacionException("PAYMENTS_USER_NOT_FOUND",
                        "Usuario no encontrado en la empresa activa.", HttpStatus.UNAUTHORIZED));
    }

    private BigDecimal fallbackPercent(ConfiguracionPagosEntity entity) {
        return entity == null || entity.getTerminalCommissionPercent() == null
                ? ZERO_PERCENT
                : normalizePercent(entity.getTerminalCommissionPercent());
    }

    private BigDecimal normalizePercent(BigDecimal value) {
        BigDecimal normalized = (value == null ? BigDecimal.ZERO : value).setScale(4, RoundingMode.HALF_UP);
        if (normalized.signum() < 0 || normalized.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("El porcentaje de comision debe estar entre 0 y 100.");
        }
        return normalized;
    }

    private String normalizeChoice(String value, Set<String> allowed, String fallback) {
        String normalized = defaultIfBlank(value, fallback).trim().toUpperCase(Locale.ROOT);
        normalized = normalized.replace(" ", "_").replace("-", "_");
        return allowed.contains(normalized) ? normalized : fallback;
    }

    private String normalizeType(String value) {
        String normalized = normalizeCode(value);
        if (normalized == null) {
            return "CARD";
        }
        if (TIPOS.contains(normalized)) {
            return normalized;
        }
        if (normalized.contains("EFECTIVO") || normalized.contains("CASH")) {
            return "CASH";
        }
        if (normalized.contains("TERMINAL") || normalized.contains("MERCADO_PAGO")) {
            return "TERMINAL";
        }
        if (normalized.contains("TARJETA") || normalized.contains("CREDITO") || normalized.contains("DEBITO")
                || normalized.contains("CARD")) {
            return "CARD";
        }
        if (normalized.contains("VALE") || normalized.contains("VOUCHER")) {
            return "VOUCHER";
        }
        return "CARD";
    }

    private String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return normalized.isBlank() ? null : normalized;
    }

    private boolean defaultRequiresReference(String type) {
        return "TERMINAL".equals(type) || "CARD".equals(type) || "VOUCHER".equals(type);
    }

    private boolean defaultRequiresVerification(String type) {
        return "TERMINAL".equals(type) || "CARD".equals(type) || "VOUCHER".equals(type);
    }

    private String cleanText(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replace("<", "").replace(">", "");
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private String cleanKey(String value) {
        String normalized = normalizeCode(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.trim().isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private String providerLabel(String provider) {
        return switch (defaultIfBlank(provider, "MERCADO_PAGO")) {
            case "CLIP" -> "Clip";
            case "CONEKTA" -> "Conekta";
            case "BANCO" -> "Banco";
            default -> "Mercado Pago";
        };
    }

    private EmpresasEntity empresaRef(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }

    private List<PaymentMethodSeed> paymentSeeds() {
        return List.of(
                new PaymentMethodSeed("TERMINAL", "Terminal", "TERMINAL", true, 1, true, true),
                new PaymentMethodSeed("EFECTIVO", "Efectivo", "CASH", true, 2, false, false),
                new PaymentMethodSeed("TARJETA", "Tarjeta", "CARD", false, 3, true, true),
                new PaymentMethodSeed("VALES", "Vales", "VOUCHER", false, 4, true, true));
    }

    private record PaymentMethodSeed(String code, String name, String type, boolean active, int order,
            boolean reference, boolean verify) {}
}
