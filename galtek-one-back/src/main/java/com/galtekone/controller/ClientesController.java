package com.galtekone.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.entity.ClientesEntity;
import com.galtekone.services.ClientesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping(path = "clientes")
public class ClientesController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private ClientesService clientesService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getClientes(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<ClientesEntity> specs = dynamicSpecification.buildSpecification(filters, ClientesEntity.class);
            Object resp = clientesService.read(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Clientes obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener los clientes: " + e.getMessage(), e);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postClientes(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody ClientesEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = clientesService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear el cliente: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putClientes(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody ClientesEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            entity.setIdCliente(id);
            Object resp = clientesService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar el cliente: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> desactivarCliente(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "INACTIVO", extractMotivo(request), "Cliente desactivado con exito");
    }

    @PutMapping(path = "/{id}/archivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> archivarCliente(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "ARCHIVADO", extractMotivo(request), "Cliente archivado con exito");
    }

    @PutMapping(path = "/{id}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> reactivarCliente(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "ACTIVO", extractMotivo(request), "Cliente reactivado con exito");
    }

    @GetMapping(path = "/{id}/eliminacion-segura", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> revisarEliminacionCliente(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = clientesService.deletePolicy(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Revision de eliminacion obtenida con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al revisar eliminacion del cliente: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteClientes(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = clientesService.delete(id, extractMotivo(request), user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente eliminado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al eliminar el cliente: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getClienteById(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();

        try {
            ClienteConPedidosDTO resp = clientesService.readById(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente obtenido con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener el cliente: " + e.getMessage(), e);
        }
    }

    private ResponseEntity<Object> changeEstado(String user, Integer id, String estado, String motivo, String message) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = clientesService.changeEstado(id, estado, motivo, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, message);
        } catch (Exception e) {
            return handleError(user, startTime, "Error al cambiar estado del cliente: " + e.getMessage(), e);
        }
    }

    private String extractMotivo(Map<String, Object> request) {
        Object value = request == null ? null : request.get("motivo");
        return value == null ? null : String.valueOf(value);
    }

    private ResponseEntity<Object> handleError(String user, long startTime, String message, Exception e) {
        if (e instanceof IllegalArgumentException) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
        }
        if (e instanceof EntityNotFoundException) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.NOT_FOUND);
        }
        if (e instanceof IllegalStateException) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.CONFLICT);
        }
        return ApiResponseBuilder.buildErrorResponse(user, startTime, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
