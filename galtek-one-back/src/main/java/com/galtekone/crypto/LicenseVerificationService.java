package com.galtekone.crypto;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.PublicKey;

@Service
public class LicenseVerificationService {

    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            Resource resource = new ClassPathResource("certs/license_public_key.pem");
            if (!resource.exists()) {
                System.err.println("ALERTA CRITICA: No se encontro certs/license_public_key.pem en el classpath.");
                return;
            }
            String pem = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            this.publicKey = PemUtils.parsePublicKeyFromPem(pem);
        } catch (Exception e) {
            throw new IllegalStateException("Fallo al cargar y parsear la llave publica de licencia", e);
        }
    }

    public Claims verifyLicense(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("El token esta vacio");
        }
        if (publicKey == null) {
            throw new IllegalStateException("Llave publica no cargada");
        }
        
        try {
            // Validacion criptografica estricta de la firma RS256
            Jws<Claims> jws = Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token);
            
            return jws.getBody();
        } catch (Exception e) {
            // Firma invalida, modificada por un pirata, expirada o malformada
            throw new IllegalArgumentException("Token invalido o corrupto: " + e.getMessage(), e);
        }
    }
}
