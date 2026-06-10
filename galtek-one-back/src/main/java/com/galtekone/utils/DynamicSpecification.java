package com.galtekone.utils;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

@Service
public class DynamicSpecification {

	public <T> Specification<T> buildSpecification(Map<String, String> filters, Class<T> entityClass) {
        return (Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Predicate[] predicates = filters.entrySet().stream()
                .map(entry -> buildPredicate(entry.getKey(), entry.getValue(), root, cb))
                .filter(predicate -> predicate != null)
                .toArray(Predicate[]::new);

            return cb.and(predicates);
        };
    }

	private <T> Predicate buildPredicate(String field, String rawValue, Root<T> root, CriteriaBuilder cb) {
	    if (rawValue == null || rawValue.trim().isEmpty()) return null;

	    String operator = "=";
	    String value = rawValue.trim();

	    // Detectar el operador
	    if (value.startsWith(">=")) {
	        operator = ">=";
	        value = value.substring(2);
	    } else if (value.startsWith("<=")) {
	        operator = "<=";
	        value = value.substring(2);
	    } else if (value.startsWith(">")) {
	        operator = ">";
	        value = value.substring(1);
	    } else if (value.startsWith("<")) {
	        operator = "<";
	        value = value.substring(1);
	    } else if (value.startsWith("=")) {
	        operator = "=";
	        value = value.substring(1);
	    }

	    Path<?> path = root.get(field);
	    Class<?> type = path.getJavaType();

	    try {
	        if (type == String.class) {
	            return cb.like(cb.lower(root.get(field)), "%" + value.toLowerCase() + "%");

	        } else if (type == Integer.class) {
	            Integer intValue = Integer.valueOf(value);
	            return buildNumericPredicate(cb, root.get(field), operator, intValue);

	        } else if (type == Long.class) {
	            Long longValue = Long.valueOf(value);
	            return buildNumericPredicate(cb, root.get(field), operator, longValue);

	        } else if (type == Double.class) {
	            Double doubleValue = Double.valueOf(value);
	            return buildNumericPredicate(cb, root.get(field), operator, doubleValue);

	        } else if (type == LocalDateTime.class) {
	        	LocalDateTime dateValue = LocalDateTime.parse(value); 
	            return buildComparablePredicate(cb, root.get(field), operator, dateValue);
	        }

	    } catch (Exception e) {
	        // Si falla la conversión, ignora el filtro
	        return null;
	    }

	    return null;
	}

	private <Y extends Comparable<? super Y>> Predicate buildComparablePredicate(CriteriaBuilder cb, Path<Y> path, String op, Y value) {
	    return switch (op) {
	        case ">" -> cb.greaterThan(path, value);
	        case ">=" -> cb.greaterThanOrEqualTo(path, value);
	        case "<" -> cb.lessThan(path, value);
	        case "<=" -> cb.lessThanOrEqualTo(path, value);
	        default -> cb.equal(path, value);
	    };
	}

	private <N extends Number & Comparable<N>> Predicate buildNumericPredicate(CriteriaBuilder cb, Path<N> path, String op, N value) {
	    return buildComparablePredicate(cb, path, op, value);
	}

	
}
