package com.galtekone.utils;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiResponse<T> {

	 private int statusCode;
	    private String status;
	    private String user;
	    private LocalDateTime timestamp;
	    private long durationMs;
	    private String message;
	    private T data;

	    public ApiResponse(int statusCode, String status, String user, LocalDateTime timestamp,
	                       long durationMs, String message, T data) {
	        this.statusCode = statusCode;
	        this.status = status;
	        this.user = user;
	        this.timestamp = timestamp;
	        this.durationMs = durationMs;
	        this.message = message;
	        this.data = data;
	    }
	
}
