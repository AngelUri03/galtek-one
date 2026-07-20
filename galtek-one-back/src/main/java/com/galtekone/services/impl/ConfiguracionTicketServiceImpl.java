package com.galtekone.services.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.ticket.TicketConfigDTO;
import com.galtekone.entity.ConfiguracionTicketEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.repository.ConfiguracionTicketRepository;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.services.ConfiguracionTicketService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfiguracionTicketServiceImpl implements ConfiguracionTicketService {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Set<String> PAPER_SIZES = Set.of("58", "80");
    private static final Set<String> DENSITIES = Set.of("COMPACTA", "NORMAL", "COMODA");
    private static final Set<String> FONT_SIZES = Set.of("CHICA", "NORMAL", "GRANDE");
    private static final Set<String> FONT_FAMILIES = Set.of("KODCHASAN", "ARIAL", "COURIER", "CONSOLAS");
    private static final Set<String> LINE_SPACINGS = Set.of("COMPACTO", "NORMAL", "AMPLIO");
    private static final Set<String> MARGIN_SIZES = Set.of("ESTRECHO", "NORMAL", "AMPLIO");
    private static final Set<String> SEPARATORS = Set.of("NINGUNO", "SIMPLE", "PUNTEADO", "DOBLE");
    private static final Set<String> ALIGNMENTS = Set.of("IZQUIERDA", "CENTRO", "DERECHA");
    private static final Set<String> REQUIRED_BLOCKS = Set.of("SALE_INFO", "PRODUCTS", "TOTALS");
    private static final int MAX_TEMPLATE_LENGTH = 20_000;

    private final ConfiguracionTicketRepository configuracionTicketRepository;
    private final EmpresasRepository empresasRepository;

    @Override
    public TicketConfigDTO readActual() {
        EmpresasEntity empresa = readEmpresaActual();
        return configuracionTicketRepository.findFirstByEmpresa_IdEmpresa(empresa.getIdEmpresa())
                .map(entity -> toDto(entity, empresa))
                .orElseGet(() -> defaultDto(empresa));
    }

    @Override
    public TicketConfigDTO updateActual(TicketConfigDTO dto, String user) {
        if (dto == null) {
            throw new IllegalArgumentException("La configuracion de ticket es obligatoria");
        }

        EmpresasEntity empresa = readEmpresaActual();
        ConfiguracionTicketEntity entity = configuracionTicketRepository
                .findFirstByEmpresa_IdEmpresa(empresa.getIdEmpresa())
                .orElseGet(() -> createEntity(empresa, user));

        applyDto(entity, dto);
        entity.setUsuarioModificacion(user);
        ConfiguracionTicketEntity saved = configuracionTicketRepository.save(entity);
        return toDto(saved, empresa);
    }

    @Override
    public TicketConfigDTO restoreDefault(String user) {
        EmpresasEntity empresa = readEmpresaActual();
        ConfiguracionTicketEntity entity = configuracionTicketRepository
                .findFirstByEmpresa_IdEmpresa(empresa.getIdEmpresa())
                .orElseGet(() -> createEntity(empresa, user));

        applyDefaults(entity);
        entity.setUsuarioModificacion(user);
        ConfiguracionTicketEntity saved = configuracionTicketRepository.save(entity);
        return toDto(saved, empresa);
    }

    private ConfiguracionTicketEntity createEntity(EmpresasEntity empresa, String user) {
        ConfiguracionTicketEntity entity = new ConfiguracionTicketEntity();
        entity.setEmpresa(empresa);
        entity.setUsuarioCreacion(user);
        entity.setEstatus(true);
        return entity;
    }

    private EmpresasEntity readEmpresaActual() {
        Integer idEmpresa = EmpresaContextHolder.getEmpresaId();
        if (idEmpresa == null) {
            throw new IllegalArgumentException("No se pudo determinar la empresa activa");
        }
        return empresasRepository.findById(idEmpresa)
                .orElseThrow(() -> new EntityNotFoundException("Empresa actual no encontrada"));
    }

    private void applyDto(ConfiguracionTicketEntity entity, TicketConfigDTO dto) {
        entity.setPaperSize(normalizeChoice(dto.getPaperSize(), PAPER_SIZES, "58", "tamano de papel"));
        entity.setDensity(normalizeChoice(dto.getDensity(), DENSITIES, "NORMAL", "densidad"));
        entity.setFontSize(normalizeChoice(dto.getFontSize(), FONT_SIZES, "NORMAL", "tamano de letra"));
        entity.setFontFamily(normalizeChoice(dto.getFontFamily(), FONT_FAMILIES, "KODCHASAN", "tipografia"));
        entity.setLineSpacing(normalizeChoice(dto.getLineSpacing(), LINE_SPACINGS, "NORMAL", "espaciado"));
        entity.setMarginSize(normalizeChoice(dto.getMarginSize(), MARGIN_SIZES, "NORMAL", "margen"));
        entity.setSeparatorStyle(normalizeChoice(dto.getSeparatorStyle(), SEPARATORS, "SIMPLE", "separador"));
        entity.setAlignment(normalizeChoice(dto.getAlignment(), ALIGNMENTS, "CENTRO", "alineacion"));
        entity.setDefaultPrinterName(trimToNull(dto.getDefaultPrinterName(), 255));
        entity.setCopies(normalizeCopies(dto.getCopies()));
        entity.setAutoPrint(Boolean.TRUE.equals(dto.getAutoPrint()));
        entity.setAskBeforePrint(Boolean.TRUE.equals(dto.getAskBeforePrint()));
        entity.setAllowReprint(!Boolean.FALSE.equals(dto.getAllowReprint()));
        entity.setShowLogo(!Boolean.FALSE.equals(dto.getShowLogo()));
        entity.setFooterMessage(cleanText(dto.getFooterMessage(), 120));
        entity.setTemplateJson(validateAndCompactTemplate(dto.getTemplateJson()));
    }

    private void applyDefaults(ConfiguracionTicketEntity entity) {
        entity.setPaperSize("58");
        entity.setDensity("NORMAL");
        entity.setFontSize("NORMAL");
        entity.setFontFamily("KODCHASAN");
        entity.setLineSpacing("NORMAL");
        entity.setMarginSize("NORMAL");
        entity.setSeparatorStyle("SIMPLE");
        entity.setAlignment("CENTRO");
        entity.setDefaultPrinterName(null);
        entity.setCopies(1);
        entity.setAutoPrint(false);
        entity.setAskBeforePrint(true);
        entity.setAllowReprint(true);
        entity.setShowLogo(true);
        entity.setFooterMessage("Gracias por su compra");
        entity.setTemplateJson(defaultTemplateJson());
    }

    private TicketConfigDTO defaultDto(EmpresasEntity empresa) {
        TicketConfigDTO dto = new TicketConfigDTO();
        dto.setIdEmpresa(empresa.getIdEmpresa());
        dto.setPaperSize("58");
        dto.setDensity("NORMAL");
        dto.setFontSize("NORMAL");
        dto.setFontFamily("KODCHASAN");
        dto.setLineSpacing("NORMAL");
        dto.setMarginSize("NORMAL");
        dto.setSeparatorStyle("SIMPLE");
        dto.setAlignment("CENTRO");
        dto.setCopies(1);
        dto.setAutoPrint(false);
        dto.setAskBeforePrint(true);
        dto.setAllowReprint(true);
        dto.setShowLogo(true);
        dto.setFooterMessage(defaultFooter(empresa));
        dto.setTemplateJson(defaultTemplateJson());
        dto.setCustomized(false);
        dto.setTienda(buildStorePayload(empresa));
        return dto;
    }

    private TicketConfigDTO toDto(ConfiguracionTicketEntity entity, EmpresasEntity empresa) {
        TicketConfigDTO dto = new TicketConfigDTO();
        dto.setIdConfiguracionTicket(entity.getIdConfiguracionTicket());
        dto.setIdEmpresa(empresa.getIdEmpresa());
        dto.setPaperSize(defaultIfBlank(entity.getPaperSize(), "58"));
        dto.setDensity(defaultIfBlank(entity.getDensity(), "NORMAL"));
        dto.setFontSize(defaultIfBlank(entity.getFontSize(), "NORMAL"));
        dto.setFontFamily(defaultIfBlank(entity.getFontFamily(), "KODCHASAN"));
        dto.setLineSpacing(defaultIfBlank(entity.getLineSpacing(), "NORMAL"));
        dto.setMarginSize(defaultIfBlank(entity.getMarginSize(), "NORMAL"));
        dto.setSeparatorStyle(defaultIfBlank(entity.getSeparatorStyle(), "SIMPLE"));
        dto.setAlignment(defaultIfBlank(entity.getAlignment(), "CENTRO"));
        dto.setDefaultPrinterName(entity.getDefaultPrinterName());
        dto.setCopies(entity.getCopies() == null ? 1 : entity.getCopies());
        dto.setAutoPrint(Boolean.TRUE.equals(entity.getAutoPrint()));
        dto.setAskBeforePrint(entity.getAskBeforePrint() == null || Boolean.TRUE.equals(entity.getAskBeforePrint()));
        dto.setAllowReprint(entity.getAllowReprint() == null || Boolean.TRUE.equals(entity.getAllowReprint()));
        dto.setShowLogo(entity.getShowLogo() == null || Boolean.TRUE.equals(entity.getShowLogo()));
        dto.setFooterMessage(defaultIfBlank(entity.getFooterMessage(), defaultFooter(empresa)));
        dto.setTemplateJson(defaultIfBlank(entity.getTemplateJson(), defaultTemplateJson()));
        dto.setCustomized(!matchesDefault(entity));
        dto.setFechaModificacion(entity.getFechaModificacion());
        dto.setTienda(buildStorePayload(empresa));
        return dto;
    }

    private boolean matchesDefault(ConfiguracionTicketEntity entity) {
        return "58".equals(defaultIfBlank(entity.getPaperSize(), "58"))
                && "NORMAL".equals(defaultIfBlank(entity.getDensity(), "NORMAL"))
                && "NORMAL".equals(defaultIfBlank(entity.getFontSize(), "NORMAL"))
                && "KODCHASAN".equals(defaultIfBlank(entity.getFontFamily(), "KODCHASAN"))
                && "NORMAL".equals(defaultIfBlank(entity.getLineSpacing(), "NORMAL"))
                && "NORMAL".equals(defaultIfBlank(entity.getMarginSize(), "NORMAL"))
                && "SIMPLE".equals(defaultIfBlank(entity.getSeparatorStyle(), "SIMPLE"))
                && "CENTRO".equals(defaultIfBlank(entity.getAlignment(), "CENTRO"))
                && entity.getDefaultPrinterName() == null
                && (entity.getCopies() == null || entity.getCopies() == 1)
                && !Boolean.TRUE.equals(entity.getAutoPrint())
                && (entity.getAskBeforePrint() == null || Boolean.TRUE.equals(entity.getAskBeforePrint()))
                && (entity.getAllowReprint() == null || Boolean.TRUE.equals(entity.getAllowReprint()))
                && (entity.getShowLogo() == null || Boolean.TRUE.equals(entity.getShowLogo()))
                && defaultTemplateJson().equals(defaultIfBlank(entity.getTemplateJson(), defaultTemplateJson()));
    }

    private Map<String, Object> buildStorePayload(EmpresasEntity empresa) {
        Map<String, Object> tienda = new LinkedHashMap<>();
        tienda.put("nombre", empresa.getNombreEmpresa());
        tienda.put("razonSocial", empresa.getRazonSocial());
        tienda.put("rfc", empresa.getRfc());
        tienda.put("direccion", empresa.getDireccion());
        tienda.put("direccionCalle", empresa.getDireccionCalle());
        tienda.put("direccionNumeroExterior", empresa.getDireccionNumeroExterior());
        tienda.put("direccionNumeroInterior", empresa.getDireccionNumeroInterior());
        tienda.put("direccionColonia", empresa.getDireccionColonia());
        tienda.put("direccionMunicipio", empresa.getDireccionMunicipio());
        tienda.put("direccionEstado", empresa.getDireccionEstado());
        tienda.put("direccionCodigoPostal", empresa.getDireccionCodigoPostal());
        tienda.put("telefono", empresa.getTelefono());
        tienda.put("whatsapp", empresa.getWhatsapp());
        tienda.put("correo", empresa.getCorreo());
        tienda.put("horarioOperacion", empresa.getHorarioOperacion());
        tienda.put("moneda", empresa.getMoneda());
        tienda.put("zonaHoraria", empresa.getZonaHoraria());
        tienda.put("ticketMensaje", empresa.getTicketMensaje());
        tienda.put("logoNombre", empresa.getLogoNombre());
        tienda.put("logoMimeType", empresa.getLogoMimeType());
        tienda.put("logoBase64", empresa.getLogoBase64());
        return tienda;
    }

    private String validateAndCompactTemplate(String templateJson) {
        String normalized = trimToNull(templateJson, MAX_TEMPLATE_LENGTH);
        if (normalized == null) {
            return defaultTemplateJson();
        }
        if (normalized.length() > MAX_TEMPLATE_LENGTH) {
            throw new IllegalArgumentException("La plantilla del ticket es demasiado grande");
        }

        try {
            JsonNode root = JSON.readTree(normalized);
            JsonNode blocksNode = root.path("blocks");
            if (!blocksNode.isArray() || blocksNode.size() == 0) {
                throw new IllegalArgumentException("La plantilla debe tener bloques configurables");
            }

            validateRequiredBlocks((ArrayNode) blocksNode);
            ensureSafeText(root);
            return JSON.writeValueAsString(root);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("La plantilla del ticket no tiene un formato valido");
        }
    }

    private void validateRequiredBlocks(ArrayNode blocks) {
        for (String required : REQUIRED_BLOCKS) {
            boolean found = false;
            for (JsonNode block : blocks) {
                if (required.equals(block.path("type").asText())
                        && !Boolean.FALSE.equals(block.path("visible").asBoolean(true))) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new IllegalArgumentException("El ticket debe conservar venta, productos y totales visibles");
            }
        }
    }

    private void ensureSafeText(JsonNode node) {
        if (node.isTextual()) {
            String value = node.asText().toLowerCase(Locale.ROOT);
            if (value.contains("<script") || value.contains("javascript:")) {
                throw new IllegalArgumentException("La plantilla contiene texto no permitido");
            }
            return;
        }

        if (node.isArray() || node.isObject()) {
            node.elements().forEachRemaining(this::ensureSafeText);
        }
    }

    private String normalizeChoice(String value, Set<String> allowed, String fallback, String label) {
        String normalized = defaultIfBlank(value, fallback).trim().toUpperCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException("El valor de " + label + " no es valido");
        }
        return normalized;
    }

    private Integer normalizeCopies(Integer value) {
        int copies = value == null ? 1 : value;
        if (copies < 1 || copies > 5) {
            throw new IllegalArgumentException("Las copias deben estar entre 1 y 5");
        }
        return copies;
    }

    private String cleanText(String value, int maxLength) {
        String normalized = trimToNull(value, maxLength);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.replace("<", "").replace(">", "");
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private String trimToNull(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private String defaultFooter(EmpresasEntity empresa) {
        return defaultIfBlank(empresa.getTicketMensaje(), "Gracias por su compra");
    }

    private String defaultTemplateJson() {
        try {
            Map<String, Object> template = new LinkedHashMap<>();
            template.put("version", 1);
            template.put("blocks", defaultBlocks());
            return JSON.writeValueAsString(template);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo construir la plantilla base de ticket", ex);
        }
    }

    private List<Map<String, Object>> defaultBlocks() {
        List<Map<String, Object>> blocks = new ArrayList<>();
        blocks.add(block("store-logo", "LOGO", "Logo", true, false));
        blocks.add(block("store-header", "STORE_HEADER", "Encabezado de tienda", true, false));
        blocks.add(block("sale-info", "SALE_INFO", "Datos de venta", true, true));
        blocks.add(block("customer", "CUSTOMER", "Cliente", false, false));
        blocks.add(block("products", "PRODUCTS", "Productos", true, true));
        blocks.add(block("totals", "TOTALS", "Totales", true, true));
        blocks.add(block("payment", "PAYMENT", "Pago y cambio", true, false));
        blocks.add(block("cashier", "CASHIER", "Cajero", true, false));
        blocks.add(block("footer-message", "FOOTER_MESSAGE", "Mensaje final", true, false));
        blocks.add(block("folio-code", "FOLIO_CODE", "Folio y codigo", false, false));
        return blocks;
    }

    private Map<String, Object> block(String id, String type, String label, boolean visible, boolean required) {
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("id", id);
        block.put("type", type);
        block.put("label", label);
        block.put("visible", visible);
        block.put("required", required);
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("align", "CENTRO");
        settings.put("fontSize", "NORMAL");
        settings.put("bold", false);
        settings.put("italic", false);
        settings.put("uppercase", false);
        settings.put("nameBold", false);
        settings.put("nameItalic", false);
        settings.put("nameUnderline", false);
        settings.put("nameUppercase", false);
        settings.put("fiscalBold", false);
        settings.put("fiscalItalic", false);
        settings.put("fiscalUnderline", false);
        settings.put("fiscalUppercase", false);
        settings.put("addressBold", false);
        settings.put("addressItalic", false);
        settings.put("addressUnderline", false);
        settings.put("addressUppercase", false);
        settings.put("contactBold", false);
        settings.put("contactItalic", false);
        settings.put("contactUnderline", false);
        settings.put("contactUppercase", false);
        settings.put("labelBold", false);
        settings.put("labelItalic", false);
        settings.put("labelUnderline", false);
        settings.put("labelUppercase", false);
        settings.put("valueBold", true);
        settings.put("valueItalic", false);
        settings.put("valueUnderline", false);
        settings.put("valueUppercase", false);
        settings.put("separatorAfter", true);
        if ("LOGO".equals(type)) {
            settings.put("logoSize", "MEDIANO");
            settings.put("separatorAfter", false);
        }
        if ("STORE_HEADER".equals(type)) {
            settings.put("bold", true);
            settings.put("nameBold", true);
            settings.put("showAddress", true);
            settings.put("showContact", true);
            settings.put("contactLayout", "LINEA");
            settings.put("showPhone", true);
            settings.put("showWhatsapp", true);
            settings.put("showEmail", true);
            settings.put("showWhatsappIcon", true);
        }
        block.put("settings", settings);
        return block;
    }
}
