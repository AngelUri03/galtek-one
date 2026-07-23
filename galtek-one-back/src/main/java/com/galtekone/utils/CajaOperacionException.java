package com.galtekone.utils;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class CajaOperacionException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public CajaOperacionException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
