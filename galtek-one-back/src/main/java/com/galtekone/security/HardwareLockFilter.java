package com.galtekone.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.utils.ApiResponseBuilder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class HardwareLockFilter extends OncePerRequestFilter {

    @Autowired
    private DeviceLockState deviceLockState;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (deviceLockState.isLocked()) {
            String path = request.getServletPath();
            // Permitir rutas criticas para login, identidad y reactivacion
            if (path.startsWith("/auth/") || path.equals("/device/identity") || path.equals("/device/activate")) {
                filterChain.doFilter(request, response);
                return;
            }

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            // Reutilizamos el formato de respuesta del proyecto
            Object errorResponse = ApiResponseBuilder.buildErrorResponse(
                "System", 
                System.currentTimeMillis(), 
                "Instalacion bloqueada: " + deviceLockState.getLockReason() + ". Contacte a soporte.", 
                HttpStatus.FORBIDDEN
            ).getBody();

            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
