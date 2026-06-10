package com.galtekone.controller;

import com.galtekone.crypto.RsaCryptoService;
import com.galtekone.crypto.RsaKeyStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("auth/keys")
@RequiredArgsConstructor
public class AuthKeysController {

  private final RsaKeyStoreService keyStore;
  private final RsaCryptoService crypto;

  @PostMapping(value="/generate", produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> generate(@RequestParam(defaultValue = "false") boolean overwrite) {
    try {
      boolean created = keyStore.generateAndSave(overwrite);

      if (created) return ResponseEntity.status(HttpStatus.CREATED).body("Llaves RSA creadas");
      return ResponseEntity.ok("Llaves RSA ya existían; no se sobreescribieron");
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Error al generar llaves RSA");
    }
  }
}
