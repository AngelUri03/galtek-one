package com.galtekone.utils;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ApiResponseBuilder {

	public static <T> ResponseEntity<Object> buildSuccessResponse(T data, String user, long startTime, String message) {
	    long duration = System.currentTimeMillis() - startTime;

	    ApiResponse<T> response = new ApiResponse<>(
	        200,
	        "OK",
	        user,
	        LocalDateTime.now(),
	        duration,
	        message,
	        data
	    );

	    return ResponseEntity.ok(response);
	}

    public static ResponseEntity<Object> buildErrorResponse(String user, long startTime, String errorMessage, HttpStatus status) {
        long duration = System.currentTimeMillis() - startTime;

        ApiResponse<Object> response = new ApiResponse<>(
            status.value(),
            status.getReasonPhrase(),
            user,
            LocalDateTime.now(),
            duration,
            errorMessage,
            null
        );

        return ResponseEntity.status(status).body(response);
    }
}
