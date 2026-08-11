# Especificaciones de Integración (Backend Hub ↔ Frontend POS)
**Asunto:** Manejo de Excepciones JWT y Flujo de Renovación de Licencias
**Para:** Agente de IA a cargo del desarrollo del Galtek POS

---

## 1. Contexto del Sistema
El backend (Galtek Hub) emite licencias en formato **JWT (JSON Web Token)** firmadas criptográficamente usando el algoritmo **RS256** (llave asimétrica). 
El JWT incluye la fecha de vencimiento (`exp`) y las características de hardware de la máquina vinculada. 

Actualmente el POS se bloquea con un error genérico ("Licencia inválida o corrupta") cuando el token caduca o falla, dejando al usuario sin salida. Se requiere implementar el manejo fino de errores y una interfaz de reactivación.

---

## 2. Payload del JWT (Referencia)
Cuando el POS reciba un JWT, el payload decodificado tendrá esta estructura exacta:
```json
{
  "sub": "7490ba8e-571d-4d05-be69-49cbe70a7c6e",
  "cpuHash": "1bebac...",
  "motherboardHash": "67aa9e...",
  "macHash": "338076...",
  "diskHash": "5a44aa...",
  "iat": 1785290714,
  "exp": 1785377114,
  "features": {
    "max_users": 5,
    "modules": ["sales", "inventory_advanced"]
  }
}
```

---

## 3. Requerimiento Técnico 1: Manejo Específico de Excepciones
El POS debe dejar de agrupar todas las validaciones del JWT en un solo bloque `catch (Exception)`. Si el POS está escrito en **Java** usando librerías estándar como `jjwt` o `java-jwt` (o su equivalente en Node/C#), se deben atrapar las excepciones criptográficas específicas y traducirlas a mensajes amigables para el usuario final.

Implementar la siguiente estructura de validación:

1. **Expiración del Token (`ExpiredJwtException` o similar)**
   - **Causa:** El reloj local de la PC superó el timestamp del claim `exp`.
   - **Acción UI:** Mostrar pantalla de bloqueo con el mensaje: *"Su licencia ha expirado. Contacte a Galtek para renovarla."*

2. **Firma Inválida (`SignatureException` o similar)**
   - **Causa:** Alguien alteró el payload del JWT intentando hackear fechas o features, rompiendo la firma RSA.
   - **Acción UI:** Mostrar pantalla de bloqueo con el mensaje: *"Alerta de Seguridad: Token manipulado o falsificado."*

3. **Inconsistencia de Hardware (Validación Manual Lógica)**
   - **Causa:** El JWT es criptográficamente válido, pero los hashes guardados en el token (`cpuHash`, `macHash`, etc.) **no coinciden** con el hardware actual donde está corriendo el POS (intentaron copiar la BD a otra PC).
   - **Acción UI:** Mostrar pantalla de bloqueo con el mensaje: *"Equipo no reconocido. ¿Cambió componentes de su computadora o movió el sistema?"*

4. **Fallo Genérico o Token Ausente**
   - **Causa:** Archivo de instalación borrado, nulo o malformado.
   - **Acción UI:** Mostrar pantalla de Primera Activación (Para emitir un nuevo Código de Máquina).

---

## 4. Requerimiento Técnico 2: Pantalla de Reactivación
En **cualquiera** de los 3 escenarios de bloqueo mencionados arriba (Expiración, Firma, o Hardware), el usuario ya no debe quedar atrapado.

**Se debe construir/modificar la Interfaz de Bloqueo (Pantalla Roja) para incluir:**
1. **Texto visible:** Mostrar claramente el `Código de Máquina` actual de la PC (en Base64) para que el cliente pueda copiarlo y enviarlo por WhatsApp al soporte de Galtek.
2. **Input de Texto:** Un campo de texto grande o área de texto que diga *"Ingrese aquí su nuevo token de activación"*.
3. **Botón "Reactivar":** Al presionarlo, el POS debe intentar validar el nuevo JWT inyectado. Si la validación (Paso 3) es exitosa:
   - Sobreescribir el archivo local (`installation.json` o base de datos local) con el nuevo JWT.
   - Desbloquear la UI y permitir la entrada al Punto de Venta.

---

**Nota para el Agente del POS:** Ejecuta estos cambios enfocándote en la seguridad offline. La llave pública de Galtek Hub debe usarse estrictamente para verificar la firma de cualquier nuevo token que el usuario intente ingresar en el input de reactivación.
