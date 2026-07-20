package com.galtekone.config;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LocalDateStringConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        return attribute == null ? null : attribute.toString();
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }

        String value = dbData.trim();
        String isoDate = value.length() > 10 ? value.substring(0, 10) : value;

        try {
            return LocalDate.parse(isoDate);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Fecha LocalDate invalida: " + dbData, ex);
        }
    }
}
