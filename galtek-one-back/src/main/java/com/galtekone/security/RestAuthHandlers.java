package com.galtekone.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.utils.ApiResponseBuilder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RestAuthHandlers {

    @Component
    @RequiredArgsConstructor
    public static class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
        private final ObjectMapper mapper;

        @Override
        public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) throws IOException {
            long start = getStartTime(request);
            String user = "anonymous";

            var body = ApiResponseBuilder
                    .buildErrorResponse(user, start, "No autorizado: " + safeMsg(ex), HttpStatus.UNAUTHORIZED)
                    .getBody();

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
			mapper.writeValue(response.getWriter(), body);
        }
    }

    @Component
    @RequiredArgsConstructor
    public static class RestAccessDeniedHandler implements AccessDeniedHandler {
        private final ObjectMapper mapper;

        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                           AccessDeniedException ex) throws IOException {
            long start = getStartTime(request);
            String user = currentUserName(request);

            var body = ApiResponseBuilder
                    .buildErrorResponse(user, start, "Prohibido: " + safeMsg(ex), HttpStatus.FORBIDDEN)
                    .getBody();

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            mapper.writeValue(response.getWriter(), body);
        }
    }

    private static long getStartTime(HttpServletRequest req) {
        Object attr = req.getAttribute("startTime");
        return (attr instanceof Long l) ? l : System.currentTimeMillis();
    }

    private static String currentUserName(HttpServletRequest req) {
        Authentication a = (Authentication) req.getUserPrincipal();
        return (a != null && a.getName() != null) ? a.getName() : "anonymous";
    }

    private static String safeMsg(Exception ex) {
        String m = ex.getMessage();
        return (m == null || m.isBlank()) ? "Solicitud no autenticada/autorizada" : m;
    }
}
