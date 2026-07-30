package com.galtekone.services.impl;

import java.time.ZoneId;
import java.util.Currency;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.empresa.EmpresasDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.TipoSuscripcionEntity;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.TipoSuscripcionRepository;
import com.galtekone.services.EmpresasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EmpresasServiceImpl implements EmpresasService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?\\d{10,13}$");
	private static final Pattern RFC_PATTERN = Pattern.compile("^[A-Z&\\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$");
	private static final Pattern MONEDA_PATTERN = Pattern.compile("^[A-Z]{3}$");
	private static final Pattern TIME_PATTERN = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
	private static final ObjectMapper JSON = new ObjectMapper();
	private static final Set<String> VALID_CURRENCIES = Currency.getAvailableCurrencies().stream()
			.map(Currency::getCurrencyCode)
			.collect(Collectors.toUnmodifiableSet());
	private static final Set<String> VALID_TIME_ZONES = ZoneId.getAvailableZoneIds();
	private static final int MAX_LOGO_BASE64_LENGTH = 700_000;

	@Autowired
	private EmpresasRepository empresasRepository;
	
	@Autowired
	private TipoSuscripcionRepository TipoSuscripcionRepository;

	@Override
	public EmpresasEntity readActual() {
		Integer idEmpresa = requireEmpresaId();
		return empresasRepository.findById(idEmpresa)
				.orElseThrow(() -> new EntityNotFoundException("Empresa actual no encontrada"));
	}

	@Override
	public EmpresasEntity updateActual(EmpresasDTO dto, String user) {
		Integer idEmpresa = requireEmpresaId();
		if (dto == null) {
			throw new IllegalArgumentException("La informacion de tienda es obligatoria");
		}

		String nombre = normalize(dto.getNombre());
		if (nombre.isEmpty()) {
			throw new IllegalArgumentException("El nombre comercial de la tienda es obligatorio");
		}

		EmpresasEntity entityToUpdate = empresasRepository.findById(idEmpresa)
				.orElseThrow(() -> new EntityNotFoundException("Empresa actual no encontrada"));

		entityToUpdate.setNombreEmpresa(nombre);
		entityToUpdate.setRazonSocial(trimToNull(dto.getRazonSocial()));
		entityToUpdate.setRfc(normalizeRfc(dto.getRfc()));
		applyAddress(entityToUpdate, dto);
		entityToUpdate.setTelefono(sanitizePhone(dto.getTelefono()));
		entityToUpdate.setWhatsapp(sanitizePhone(dto.getWhatsapp()));
		entityToUpdate.setCorreo(normalizeEmail(dto.getCorreo()));
		applySchedule(entityToUpdate, dto);
		entityToUpdate.setMoneda(normalizeMoneda(dto.getMoneda()));
		entityToUpdate.setZonaHoraria(normalizeZonaHoraria(dto.getZonaHoraria()));
		if (dto.getTicketMensaje() != null) {
			entityToUpdate.setTicketMensaje(trimToNull(dto.getTicketMensaje()));
		}
		applyLogo(entityToUpdate, dto);

		entityToUpdate.setUsuarioModificacion(user);
		return empresasRepository.save(entityToUpdate);
	}

	@Override
	public EmpresasEntity create(EmpresasEntity obj, String user) {

		Integer idTipo = obj.getTipoSuscripcion().getIdTipoSuscripcion();

	    TipoSuscripcionEntity tipoReal = TipoSuscripcionRepository.findById(idTipo)
	        .orElseThrow(() -> new EntityNotFoundException("Tipo de suscripción no encontrado con ID: " + idTipo));

	    obj.setTipoSuscripcion(tipoReal);

	    obj.setUsuarioCreacion(user);
	    return empresasRepository.save(obj);
	}


	@Override
	public List<EmpresasEntity> read(Specification<EmpresasEntity> specs) {
		List<EmpresasEntity> resp = empresasRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	public EmpresasEntity update(EmpresasEntity obj, String user) {
	    Optional<EmpresasEntity> optional = empresasRepository.findById(obj.getIdEmpresa());

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Empresa no encontrada con ID: " + obj.getIdEmpresa());
	    }

	    EmpresasEntity entityToUpdate = optional.get();

	    if (obj.getNombreEmpresa() != null) {
	        entityToUpdate.setNombreEmpresa(obj.getNombreEmpresa());
	    }
	    if (obj.getRazonSocial() != null) {
	        entityToUpdate.setRazonSocial(obj.getRazonSocial());
	    }
	    if (obj.getRfc() != null) {
	        entityToUpdate.setRfc(obj.getRfc());
	    }
	    if (obj.getDireccion() != null) {
	        entityToUpdate.setDireccion(obj.getDireccion());
	    }
	    if (obj.getDireccionCalle() != null) {
	        entityToUpdate.setDireccionCalle(obj.getDireccionCalle());
	    }
	    if (obj.getDireccionNumeroExterior() != null) {
	        entityToUpdate.setDireccionNumeroExterior(obj.getDireccionNumeroExterior());
	    }
	    if (obj.getDireccionNumeroInterior() != null) {
	        entityToUpdate.setDireccionNumeroInterior(obj.getDireccionNumeroInterior());
	    }
	    if (obj.getDireccionColonia() != null) {
	        entityToUpdate.setDireccionColonia(obj.getDireccionColonia());
	    }
	    if (obj.getDireccionMunicipio() != null) {
	        entityToUpdate.setDireccionMunicipio(obj.getDireccionMunicipio());
	    }
	    if (obj.getDireccionEstado() != null) {
	        entityToUpdate.setDireccionEstado(obj.getDireccionEstado());
	    }
	    if (obj.getDireccionCodigoPostal() != null) {
	        entityToUpdate.setDireccionCodigoPostal(obj.getDireccionCodigoPostal());
	    }
	    if (obj.getDireccionReferencia() != null) {
	        entityToUpdate.setDireccionReferencia(obj.getDireccionReferencia());
	    }
	    if (obj.getTelefono() != null) {
	        entityToUpdate.setTelefono(obj.getTelefono());
	    }
	    if (obj.getWhatsapp() != null) {
	        entityToUpdate.setWhatsapp(obj.getWhatsapp());
	    }
	    if (obj.getCorreo() != null) {
	        entityToUpdate.setCorreo(obj.getCorreo());
	    }
	    if (obj.getHorarioOperacion() != null) {
	        entityToUpdate.setHorarioOperacion(obj.getHorarioOperacion());
	    }
	    if (obj.getHorarioConfig() != null) {
	        entityToUpdate.setHorarioConfig(obj.getHorarioConfig());
	    }
	    if (obj.getHorarioLunesViernesApertura() != null) {
	        entityToUpdate.setHorarioLunesViernesApertura(obj.getHorarioLunesViernesApertura());
	    }
	    if (obj.getHorarioLunesViernesCierre() != null) {
	        entityToUpdate.setHorarioLunesViernesCierre(obj.getHorarioLunesViernesCierre());
	    }
	    if (obj.getHorarioSabadoDomingoApertura() != null) {
	        entityToUpdate.setHorarioSabadoDomingoApertura(obj.getHorarioSabadoDomingoApertura());
	    }
	    if (obj.getHorarioSabadoDomingoCierre() != null) {
	        entityToUpdate.setHorarioSabadoDomingoCierre(obj.getHorarioSabadoDomingoCierre());
	    }
	    if (obj.getHorarioSabadoDomingoCerrado() != null) {
	        entityToUpdate.setHorarioSabadoDomingoCerrado(obj.getHorarioSabadoDomingoCerrado());
	    }
	    if (obj.getHorarioNotas() != null) {
	        entityToUpdate.setHorarioNotas(obj.getHorarioNotas());
	    }
	    if (obj.getMoneda() != null) {
	        entityToUpdate.setMoneda(obj.getMoneda());
	    }
	    if (obj.getZonaHoraria() != null) {
	        entityToUpdate.setZonaHoraria(obj.getZonaHoraria());
	    }
	    if (obj.getTicketMensaje() != null) {
	        entityToUpdate.setTicketMensaje(obj.getTicketMensaje());
	    }
	    if (obj.getLogoBase64() != null) {
	        entityToUpdate.setLogoBase64(obj.getLogoBase64());
	        entityToUpdate.setLogoMimeType(obj.getLogoMimeType());
	        entityToUpdate.setLogoNombre(obj.getLogoNombre());
	    }
	    if (obj.getFechaInicio() != null) {
	        entityToUpdate.setFechaInicio(obj.getFechaInicio());
	    }
	    if (obj.getFechaFin() != null) {
	        entityToUpdate.setFechaFin(obj.getFechaFin());
	    }
	    if (obj.getTokenLicencia() != null) {
	        entityToUpdate.setTokenLicencia(obj.getTokenLicencia());
	    }
	    if (obj.getTipoSuscripcion() != null && obj.getTipoSuscripcion().getIdTipoSuscripcion() != null) {
	        TipoSuscripcionEntity tipoReal = TipoSuscripcionRepository.findById(
	            obj.getTipoSuscripcion().getIdTipoSuscripcion())
	            .orElseThrow(() -> new EntityNotFoundException("Tipo de suscripción no encontrado"));
	        entityToUpdate.setTipoSuscripcion(tipoReal);
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return empresasRepository.save(entityToUpdate);
	}


	@Override
	public EmpresasEntity delete(Integer idEmpresa, String user) {
	    Optional<EmpresasEntity> optional = empresasRepository.findById(idEmpresa);

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Empresa no encontrada con ID: " + idEmpresa);
	    }

	    EmpresasEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);
	    empresasRepository.deleteById(idEmpresa);

	    return entity;
	}

	private Integer requireEmpresaId() {
		Integer idEmpresa = EmpresaContextHolder.getEmpresaId();
		if (idEmpresa == null) {
			throw new IllegalArgumentException("No se pudo determinar la empresa activa");
		}
		return idEmpresa;
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim();
	}

	private String trimToEmpty(String value) {
		return normalize(value);
	}

	private String trimToNull(String value) {
		String normalized = normalize(value);
		return normalized.isEmpty() ? null : normalized;
	}

	private String sanitizePhone(String value) {
		String normalized = normalize(value).replaceAll("[^\\d+]", "");
		if (normalized.isEmpty()) {
			return null;
		}
		if (!PHONE_PATTERN.matcher(normalized).matches()) {
			throw new IllegalArgumentException("El telefono debe tener entre 10 y 13 digitos");
		}
		return normalized;
	}

	private String normalizeEmail(String value) {
		String normalized = normalize(value).toLowerCase();
		if (normalized.isEmpty()) {
			return null;
		}
		if (!EMAIL_PATTERN.matcher(normalized).matches()) {
			throw new IllegalArgumentException("El correo de la tienda no tiene un formato valido");
		}
		return normalized;
	}

	private String normalizeRfc(String value) {
		String normalized = normalize(value).toUpperCase();
		if (normalized.isEmpty()) {
			return null;
		}
		if (!RFC_PATTERN.matcher(normalized).matches()) {
			throw new IllegalArgumentException("El RFC de la tienda no tiene un formato valido");
		}
		return normalized;
	}

	private String normalizeMoneda(String value) {
		String normalized = normalize(value).toUpperCase();
		if (normalized.isEmpty()) {
			return "MXN";
		}
		if (!MONEDA_PATTERN.matcher(normalized).matches()) {
			throw new IllegalArgumentException("La moneda debe usar codigo ISO de 3 letras");
		}
		if (!VALID_CURRENCIES.contains(normalized)) {
			throw new IllegalArgumentException("La moneda seleccionada no existe en el catalogo ISO");
		}
		return normalized;
	}

	private String normalizeZonaHoraria(String value) {
		String normalized = normalize(value);
		if (normalized.isEmpty()) {
			return "America/Mexico_City";
		}
		if (!VALID_TIME_ZONES.contains(normalized)) {
			throw new IllegalArgumentException("La zona horaria seleccionada no es valida");
		}
		return normalized;
	}

	private void applyAddress(EmpresasEntity target, EmpresasDTO dto) {
		target.setDireccionCalle(trimToNull(dto.getDireccionCalle()));
		target.setDireccionNumeroExterior(trimToNull(dto.getDireccionNumeroExterior()));
		target.setDireccionNumeroInterior(trimToNull(dto.getDireccionNumeroInterior()));
		target.setDireccionColonia(trimToNull(dto.getDireccionColonia()));
		target.setDireccionMunicipio(trimToNull(dto.getDireccionMunicipio()));
		target.setDireccionEstado(trimToNull(dto.getDireccionEstado()));
		target.setDireccionCodigoPostal(trimToNull(dto.getDireccionCodigoPostal()));
		target.setDireccionReferencia(trimToNull(dto.getDireccionReferencia()));

		String structured = joinParts(
				target.getDireccionCalle(),
				withLabel("No.", target.getDireccionNumeroExterior()),
				withLabel("Int.", target.getDireccionNumeroInterior()),
				target.getDireccionColonia(),
				target.getDireccionMunicipio(),
				target.getDireccionEstado(),
				withLabel("CP", target.getDireccionCodigoPostal()),
				target.getDireccionReferencia());

		String fallback = trimToEmpty(dto.getDireccion());
		target.setDireccion(!structured.isEmpty() ? structured : fallback);
	}

	private void applySchedule(EmpresasEntity target, EmpresasDTO dto) {
		String horarioConfig = trimToNull(dto.getHorarioConfig());
		if (horarioConfig != null) {
			JsonNode config = parseScheduleConfig(horarioConfig);
			target.setHorarioConfig(compactScheduleConfig(config));
			target.setHorarioOperacion(buildScheduleSummary(config, trimToNull(dto.getHorarioNotas())));
			target.setHorarioNotas(trimToNull(dto.getHorarioNotas()));
			clearLegacySchedule(target);
			return;
		}

		String lvApertura = normalizeTime(dto.getHorarioLunesViernesApertura(), "apertura de lunes a viernes");
		String lvCierre = normalizeTime(dto.getHorarioLunesViernesCierre(), "cierre de lunes a viernes");
		String sdApertura = normalizeTime(dto.getHorarioSabadoDomingoApertura(), "apertura de sabado a domingo");
		String sdCierre = normalizeTime(dto.getHorarioSabadoDomingoCierre(), "cierre de sabado a domingo");
		Boolean sdCerrado = Boolean.TRUE.equals(dto.getHorarioSabadoDomingoCerrado());

		validateTimePair(lvApertura, lvCierre, "lunes a viernes");
		if (sdCerrado) {
			sdApertura = null;
			sdCierre = null;
		} else {
			validateTimePair(sdApertura, sdCierre, "sabado a domingo");
		}

		target.setHorarioLunesViernesApertura(lvApertura);
		target.setHorarioLunesViernesCierre(lvCierre);
		target.setHorarioSabadoDomingoApertura(sdApertura);
		target.setHorarioSabadoDomingoCierre(sdCierre);
		target.setHorarioSabadoDomingoCerrado(sdCerrado);
		target.setHorarioNotas(trimToNull(dto.getHorarioNotas()));

		String summary = buildScheduleSummary(target);
		String fallback = trimToNull(dto.getHorarioOperacion());
		target.setHorarioOperacion(summary != null ? summary : fallback);
	}

	private JsonNode parseScheduleConfig(String horarioConfig) {
		try {
			JsonNode config = JSON.readTree(horarioConfig);
			validateScheduleConfig(config);
			return config;
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("La configuracion de horario no es valida");
		}
	}

	private String compactScheduleConfig(JsonNode config) {
		try {
			return JSON.writeValueAsString(config);
		} catch (Exception ex) {
			throw new IllegalArgumentException("La configuracion de horario no es valida");
		}
	}

	private void validateScheduleConfig(JsonNode config) {
		if (config == null || !config.isObject()) {
			throw new IllegalArgumentException("La configuracion de horario no es valida");
		}
		String mode = text(config.get("mode"), "WEEKDAY_WEEKEND");
		Set<String> modes = Set.of("ALWAYS_OPEN", "TEMP_CLOSED", "ALL_DAYS", "WEEKDAY_WEEKEND", "EXCEPTIONS", "CUSTOM");
		if (!modes.contains(mode)) {
			throw new IllegalArgumentException("El modo de horario no es valido");
		}

		switch (mode) {
			case "ALWAYS_OPEN", "TEMP_CLOSED" -> {
				return;
			}
			case "ALL_DAYS" -> validateScheduleRule(config.get("base"), "todos los dias", true);
			case "WEEKDAY_WEEKEND" -> {
				validateScheduleRule(config.get("weekdays"), "lunes a viernes", true);
				validateScheduleRule(config.get("weekend"), "sabado y domingo", true);
			}
			case "EXCEPTIONS" -> {
				validateScheduleRule(config.get("base"), "horario base", true);
				JsonNode exceptions = config.get("exceptions");
				if (exceptions != null && exceptions.isObject()) {
					exceptions.fields().forEachRemaining(entry -> {
						validateDayKey(entry.getKey());
						validateScheduleRule(entry.getValue(), "excepcion " + entry.getKey(), true);
					});
				}
			}
			case "CUSTOM" -> {
				JsonNode days = config.get("days");
				if (days == null || !days.isObject()) {
					throw new IllegalArgumentException("Define horarios por dia");
				}
				for (String day : dayKeys()) {
					validateScheduleRule(days.get(day), "dia " + day, true);
				}
			}
			default -> throw new IllegalArgumentException("El modo de horario no es valido");
		}
	}

	private void validateScheduleRule(JsonNode rule, String label, boolean required) {
		if (rule == null || !rule.isObject()) {
			if (required) {
				throw new IllegalArgumentException("Falta configuracion de horario para " + label);
			}
			return;
		}
		String status = text(rule.get("status"), "OPEN");
		if (!Set.of("OPEN", "CLOSED", "24H").contains(status)) {
			throw new IllegalArgumentException("Estado de horario no valido para " + label);
		}
		if (!"OPEN".equals(status)) {
			return;
		}
		String open = text(rule.get("open"), "");
		String close = text(rule.get("close"), "");
		String openTime = normalizeTime(open, "apertura de " + label);
		String closeTime = normalizeTime(close, "cierre de " + label);
		validateTimePair(openTime, closeTime, label);
	}

	private String buildScheduleSummary(JsonNode config, String notes) {
		String mode = text(config.get("mode"), "WEEKDAY_WEEKEND");
		String summary = switch (mode) {
			case "ALWAYS_OPEN" -> "Abierto 24 horas todos los dias";
			case "TEMP_CLOSED" -> "Cerrado temporalmente";
			case "ALL_DAYS" -> "Todos los dias " + ruleText(config.get("base"));
			case "WEEKDAY_WEEKEND" -> joinParts(
					"Lun a Vie " + ruleText(config.get("weekdays")),
					"Sab y Dom " + ruleText(config.get("weekend")));
			case "EXCEPTIONS" -> buildExceptionsSummary(config);
			case "CUSTOM" -> buildCustomSummary(config);
			default -> null;
		};
		return joinParts(summary, notes);
	}

	private String buildExceptionsSummary(JsonNode config) {
		String base = "Base " + ruleText(config.get("base"));
		JsonNode exceptions = config.get("exceptions");
		if (exceptions == null || !exceptions.isObject() || exceptions.isEmpty()) {
			return base;
		}
		List<String> values = new java.util.ArrayList<>();
		exceptions.fields().forEachRemaining(entry ->
				values.add(dayLabel(entry.getKey()) + " " + ruleText(entry.getValue())));
		return base + "; excepciones: " + String.join(", ", values);
	}

	private String buildCustomSummary(JsonNode config) {
		JsonNode days = config.get("days");
		List<String> values = new java.util.ArrayList<>();
		if (days != null && days.isObject()) {
			for (String day : dayKeys()) {
				values.add(dayLabel(day) + " " + ruleText(days.get(day)));
			}
		}
		return String.join(", ", values);
	}

	private String ruleText(JsonNode rule) {
		String status = text(rule != null ? rule.get("status") : null, "OPEN");
		if ("CLOSED".equals(status)) {
			return "cerrado";
		}
		if ("24H".equals(status)) {
			return "24 horas";
		}
		String open = text(rule != null ? rule.get("open") : null, "");
		String close = text(rule != null ? rule.get("close") : null, "");
		return open + "-" + close;
	}

	private void clearLegacySchedule(EmpresasEntity target) {
		target.setHorarioLunesViernesApertura(null);
		target.setHorarioLunesViernesCierre(null);
		target.setHorarioSabadoDomingoApertura(null);
		target.setHorarioSabadoDomingoCierre(null);
		target.setHorarioSabadoDomingoCerrado(null);
	}

	private String text(JsonNode node, String fallback) {
		return node == null || node.isNull() ? fallback : normalize(node.asText());
	}

	private void validateDayKey(String key) {
		if (!dayKeys().contains(key)) {
			throw new IllegalArgumentException("Dia no valido en horario: " + key);
		}
	}

	private List<String> dayKeys() {
		return List.of("mon", "tue", "wed", "thu", "fri", "sat", "sun");
	}

	private String dayLabel(String key) {
		return switch (key) {
			case "mon" -> "Lun";
			case "tue" -> "Mar";
			case "wed" -> "Mie";
			case "thu" -> "Jue";
			case "fri" -> "Vie";
			case "sat" -> "Sab";
			case "sun" -> "Dom";
			default -> key;
		};
	}

	private String normalizeTime(String value, String label) {
		String normalized = trimToNull(value);
		if (normalized == null) {
			return null;
		}
		if (!TIME_PATTERN.matcher(normalized).matches()) {
			throw new IllegalArgumentException("La hora de " + label + " debe usar formato HH:mm");
		}
		return normalized;
	}

	private void validateTimePair(String apertura, String cierre, String label) {
		if ((apertura == null) != (cierre == null)) {
			throw new IllegalArgumentException("Completa apertura y cierre para " + label);
		}
		if (apertura != null && toMinutes(cierre) <= toMinutes(apertura)) {
			throw new IllegalArgumentException("El cierre debe ser posterior a la apertura para " + label);
		}
	}

	private int toMinutes(String time) {
		String[] parts = time.split(":");
		return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
	}

	private String buildScheduleSummary(EmpresasEntity target) {
		String lunesViernes = null;
		if (target.getHorarioLunesViernesApertura() != null && target.getHorarioLunesViernesCierre() != null) {
			lunesViernes = "Lun a Vie " + target.getHorarioLunesViernesApertura() + "-"
					+ target.getHorarioLunesViernesCierre();
		}

		String finSemana = null;
		if (Boolean.TRUE.equals(target.getHorarioSabadoDomingoCerrado())) {
			finSemana = "Sab y Dom cerrado";
		} else if (target.getHorarioSabadoDomingoApertura() != null && target.getHorarioSabadoDomingoCierre() != null) {
			finSemana = "Sab y Dom " + target.getHorarioSabadoDomingoApertura() + "-"
					+ target.getHorarioSabadoDomingoCierre();
		}

		String summary = joinParts(lunesViernes, finSemana);
		if (target.getHorarioNotas() != null) {
			summary = joinParts(summary, target.getHorarioNotas());
		}
		return summary.isEmpty() ? null : summary;
	}

	private String withLabel(String label, String value) {
		return value == null ? null : label + " " + value;
	}

	private String joinParts(String... values) {
		return java.util.Arrays.stream(values)
				.map(this::trimToNull)
				.filter(value -> value != null)
				.collect(Collectors.joining(", "));
	}

	private void applyLogo(EmpresasEntity target, EmpresasDTO dto) {
		String logoBase64 = trimToNull(dto.getLogoBase64());
		if (logoBase64 == null) {
			target.setLogoBase64(null);
			target.setLogoMimeType(null);
			target.setLogoNombre(null);
			return;
		}

		if (logoBase64.length() > MAX_LOGO_BASE64_LENGTH) {
			throw new IllegalArgumentException("El logo excede el tamano permitido");
		}

		String mime = trimToNull(dto.getLogoMimeType());
		if (mime == null || !mime.matches("^image/(png|jpeg|jpg|webp|svg\\+xml)$")) {
			throw new IllegalArgumentException("El formato del logo no es valido");
		}

		target.setLogoBase64(logoBase64);
		target.setLogoMimeType(mime);
		target.setLogoNombre(trimToNull(dto.getLogoNombre()));
	}

}
