package com.galtekone.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.services.SessionService;
import com.galtekone.utils.ApiResponseBuilder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

	@Autowired
	private JwtService jwtService;

	@Autowired
	private UserDetailsService userDetailsService;

	@Autowired
	private SessionService sessionService;

	private final ObjectMapper mapper;

	@Override
	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
			throws ServletException, IOException {

		String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
		if (auth == null || !auth.startsWith("Bearer ")) {
			chain.doFilter(req, res);
			return;
		}

		String token = auth.substring(7);

		try {
			var jws = jwtService.parse(token);
			String username = jws.getBody().getSubject();
			String sid = jws.getBody().get("sid", String.class);

			sessionService.validateAndTouch(sid);
			Integer empresaId = jws.getBody().get("idEmpresa", Integer.class);
			EmpresaContextHolder.setEmpresaId(empresaId);

			var userDetails = userDetailsService.loadUserByUsername(username);
			var authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
			authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
			SecurityContextHolder.getContext().setAuthentication(authToken);

			chain.doFilter(req, res);
		} catch (Exception ex) {
			SecurityContextHolder.clearContext();
			EmpresaContextHolder.clear();

			long start = (req.getAttribute("startTime") instanceof Long l) ? l : System.currentTimeMillis();
			var body = ApiResponseBuilder
					.buildErrorResponse("anonymous", start, "No autorizado: " + safeMsg(ex), HttpStatus.UNAUTHORIZED)
					.getBody();

			res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			res.setContentType("application/json");
			mapper.writeValue(res.getWriter(), body);
		} finally {
			EmpresaContextHolder.clear();
		}
	}

	private static String safeMsg(Exception ex) {
		String message = ex.getMessage();
		if (message != null && message.toLowerCase().contains("expirada")) {
			return "Sesion expirada";
		}
		if (message != null && message.toLowerCase().contains("revocada")) {
			return "Sesion cerrada";
		}
		return "Token invalido o sesion expirada";
	}
}
