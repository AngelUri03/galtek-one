package com.galtekone.controller;

import java.util.HashMap;
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

import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedorAcuerdoEntity;
import com.galtekone.entity.ProveedorContactoEntity;
import com.galtekone.entity.ProveedorDocumentoEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.services.ProveedorActivoService;
import com.galtekone.services.ProveedorAcuerdoService;
import com.galtekone.services.ProveedorContactoService;
import com.galtekone.services.ProveedorDocumentoService;
import com.galtekone.services.ProveedorProductoService;
import com.galtekone.services.ProveedoresService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping(path = "proveedores")
public class ProveedoresController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private ProveedoresService proveedoresService;

    @Autowired
    private ProveedorContactoService proveedorContactoService;

    @Autowired
    private ProveedorProductoService proveedorProductoService;

    @Autowired
    private ProveedorActivoService proveedorActivoService;

    @Autowired
    private ProveedorDocumentoService proveedorDocumentoService;

    @Autowired
    private ProveedorAcuerdoService proveedorAcuerdoService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getProveedores(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<ProveedoresEntity> specs = dynamicSpecification.buildSpecification(filters, ProveedoresEntity.class);
            Object resp = proveedoresService.read(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor obtenido con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener los Proveedores: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = {"/page", "/paginado"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getProveedoresPaginado(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "nombreProveedor") String sort,
            @RequestParam(defaultValue = "asc") String direction) {

        long startTime = System.currentTimeMillis();

        try {
            Map<String, String> cleanFilters = new HashMap<>(filters);
            cleanFilters.remove("page");
            cleanFilters.remove("size");
            cleanFilters.remove("sort");
            cleanFilters.remove("direction");

            Specification<ProveedoresEntity> specs = dynamicSpecification.buildSpecification(cleanFilters, ProveedoresEntity.class);
            Object resp = proveedoresService.readPage(specs, page, size, sort, direction);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedores paginados obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener proveedores paginados: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getProveedorDetalle(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedoresService.detail(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de proveedor obtenido con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener el detalle del proveedor: " + e.getMessage(), e);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postProveedores(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody ProveedoresEntity entity) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedoresService.create(entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear los proveedores: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putProveedores(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody ProveedoresEntity entity) {

        long startTime = System.currentTimeMillis();

        try {
            entity.setIdProveedor(id);
            Object resp = proveedoresService.update(entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar los proveedores: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> desactivarProveedor(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "INACTIVO", extractMotivo(request), "Proveedor desactivado con exito");
    }

    @PutMapping(path = "/{id}/archivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> archivarProveedor(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "ARCHIVADO", extractMotivo(request), "Proveedor archivado con exito");
    }

    @PutMapping(path = "/{id}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> reactivarProveedor(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return changeEstado(user, id, "ACTIVO", extractMotivo(request), "Proveedor reactivado con exito");
    }

    @GetMapping(path = "/{id}/eliminacion-segura", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> revisarEliminacionProveedor(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedoresService.deletePolicy(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Revision de eliminacion obtenida con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al revisar eliminacion del proveedor: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteProveedores(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedoresService.delete(id, extractMotivo(request), user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor eliminado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al eliminar el proveedor: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}/contactos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getContactos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorContactoService.readByProveedor(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Contactos de proveedor obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener contactos: " + e.getMessage(), e);
        }
    }

    @PostMapping(path = "/{id}/contactos", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postContacto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody ProveedorContactoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorContactoService.create(id, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Contacto de proveedor creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear contacto: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/contactos/{idContacto}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putContacto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idContacto, @RequestBody ProveedorContactoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorContactoService.update(id, idContacto, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Contacto de proveedor actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar contacto: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}/contactos/{idContacto}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteContacto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idContacto) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorContactoService.delete(id, idContacto, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Contacto de proveedor desactivado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al desactivar contacto: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}/productos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getProductos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorProductoService.readByProveedor(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Productos asociados obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener productos asociados: " + e.getMessage(), e);
        }
    }

    @PostMapping(path = "/{id}/productos", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postProducto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody ProveedorProductoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorProductoService.createForProveedor(id, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto asociado creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear producto asociado: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/productos/{idProveedorProducto}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putProducto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idProveedorProducto, @RequestBody ProveedorProductoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorProductoService.updateForProveedor(id, idProveedorProducto, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto asociado actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar producto asociado: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}/productos/{idProveedorProducto}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteProducto(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idProveedorProducto) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorProductoService.deleteForProveedor(id, idProveedorProducto, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto asociado desactivado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al desactivar producto asociado: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}/activos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getActivos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorActivoService.readByProveedor(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Activos de proveedor obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener activos: " + e.getMessage(), e);
        }
    }

    @PostMapping(path = "/{id}/activos", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postActivo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody ProveedorActivoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorActivoService.create(id, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Activo de proveedor creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear activo: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/activos/{idActivo}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putActivo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idActivo, @RequestBody ProveedorActivoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorActivoService.update(id, idActivo, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Activo de proveedor actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar activo: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}/activos/{idActivo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteActivo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idActivo) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorActivoService.delete(id, idActivo, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Activo de proveedor desactivado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al desactivar activo: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}/documentos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getDocumentos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorDocumentoService.readByProveedor(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Documentos de proveedor obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener documentos: " + e.getMessage(), e);
        }
    }

    @PostMapping(path = "/{id}/documentos", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postDocumento(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody ProveedorDocumentoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorDocumentoService.create(id, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Documento de proveedor creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear documento: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/documentos/{idDocumento}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putDocumento(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idDocumento, @RequestBody ProveedorDocumentoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorDocumentoService.update(id, idDocumento, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Documento de proveedor actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar documento: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}/documentos/{idDocumento}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteDocumento(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idDocumento) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorDocumentoService.delete(id, idDocumento, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Documento de proveedor archivado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al archivar documento: " + e.getMessage(), e);
        }
    }

    @GetMapping(path = "/{id}/acuerdos", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getAcuerdos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorAcuerdoService.readByProveedor(id);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Acuerdos de proveedor obtenidos con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al obtener acuerdos: " + e.getMessage(), e);
        }
    }

    @PostMapping(path = "/{id}/acuerdos", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postAcuerdo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody ProveedorAcuerdoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorAcuerdoService.create(id, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Acuerdo de proveedor creado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al crear acuerdo: " + e.getMessage(), e);
        }
    }

    @PutMapping(path = "/{id}/acuerdos/{idAcuerdo}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putAcuerdo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idAcuerdo, @RequestBody ProveedorAcuerdoEntity entity) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorAcuerdoService.update(id, idAcuerdo, entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Acuerdo de proveedor actualizado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al actualizar acuerdo: " + e.getMessage(), e);
        }
    }

    @DeleteMapping(path = "/{id}/acuerdos/{idAcuerdo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteAcuerdo(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @PathVariable Integer idAcuerdo) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = proveedorAcuerdoService.delete(id, idAcuerdo, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Acuerdo de proveedor archivado con exito");
        } catch (Exception e) {
            return handleError(user, startTime, "Error al archivar acuerdo: " + e.getMessage(), e);
        }
    }

    private ResponseEntity<Object> changeEstado(String user, Integer id, String estado, String motivo, String message) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedoresService.changeEstado(id, estado, motivo, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, message);
        } catch (Exception e) {
            return handleError(user, startTime, "Error al cambiar estado del proveedor: " + e.getMessage(), e);
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
