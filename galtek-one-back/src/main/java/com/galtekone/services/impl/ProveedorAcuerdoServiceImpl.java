package com.galtekone.services.impl;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorAcuerdoEntity;
import com.galtekone.entity.ProveedorDocumentoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorAcuerdoRepository;
import com.galtekone.repository.ProveedorDocumentoRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorAcuerdoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorAcuerdoServiceImpl implements ProveedorAcuerdoService {

    private static final Set<String> TIPOS = Set.of(
            "CREDITO",
            "CAMBIO_CADUCIDAD",
            "PRESTAMO_ACTIVO",
            "DESCUENTO",
            "ENTREGA",
            "PEDIDO_MINIMO",
            "PAGO",
            "CONTACTO",
            "OTRO"
    );
    private static final Set<String> ESTADOS = Set.of("ACTIVO", "VENCIDO", "ARCHIVADO");

    @Autowired
    private ProveedorAcuerdoRepository repository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private ProveedorDocumentoRepository documentoRepository;

    @Override
    public List<ProveedorAcuerdoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        return repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
    }

    @Override
    public ProveedorAcuerdoEntity create(Integer idProveedor, ProveedorAcuerdoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        ensureProveedorEditable(proveedor);
        validate(obj, true);
        normalize(obj);

        obj.setProveedor(proveedor);
        obj.setDocumentoRelacionado(resolveDocumento(obj.getDocumentoRelacionado(), idProveedor, empresaId));
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        return repository.save(obj);
    }

    @Override
    public ProveedorAcuerdoEntity update(Integer idProveedor, Integer idProveedorAcuerdo, ProveedorAcuerdoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorAcuerdoEntity entity = find(idProveedor, idProveedorAcuerdo, empresaId);
        validate(obj, false);
        applyUpdate(entity, obj, idProveedor, empresaId);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        return repository.save(entity);
    }

    @Override
    public ProveedorAcuerdoEntity delete(Integer idProveedor, Integer idProveedorAcuerdo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorAcuerdoEntity entity = find(idProveedor, idProveedorAcuerdo, empresaId);

        entity.setEstadoAcuerdo("ARCHIVADO");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return repository.save(entity);
    }

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private void ensureProveedorEditable(ProveedoresEntity proveedor) {
        String estado = estadoProveedor(proveedor);
        if (!"ACTIVO".equals(estado)) {
            throw new IllegalStateException("El proveedor no esta activo. Reactivalo antes de modificar acuerdos.");
        }
    }

    private String estadoProveedor(ProveedoresEntity proveedor) {
        if (proveedor == null) return "ACTIVO";
        String estado = trimToNull(proveedor.getEstadoProveedor());
        if (estado == null) {
            return Boolean.FALSE.equals(proveedor.getEstatus()) ? "INACTIVO" : "ACTIVO";
        }
        return estado.toUpperCase();
    }

    private ProveedorAcuerdoEntity find(Integer idProveedor, Integer idAcuerdo, Integer empresaId) {
        return repository.findByIdProveedorAcuerdoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idAcuerdo, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Acuerdo no encontrado o no pertenece al proveedor"));
    }

    private void validate(ProveedorAcuerdoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("El acuerdo es obligatorio");
        if (creating && isBlank(obj.getDescripcion())) throw new IllegalArgumentException("La descripcion del acuerdo es obligatoria");
        if (!creating && obj.getDescripcion() != null && isBlank(obj.getDescripcion())) {
            throw new IllegalArgumentException("La descripcion del acuerdo no puede estar vacia");
        }
        if (!isBlank(obj.getTipo())) validateValue("tipo", obj.getTipo(), TIPOS);
        if (!isBlank(obj.getEstadoAcuerdo())) validateValue("estadoAcuerdo", obj.getEstadoAcuerdo(), ESTADOS);
        if (obj.getFechaInicio() != null && obj.getFechaVigencia() != null && obj.getFechaVigencia().isBefore(obj.getFechaInicio())) {
            throw new IllegalArgumentException("fechaVigencia no puede ser anterior a fechaInicio");
        }
    }

    private void applyUpdate(ProveedorAcuerdoEntity target, ProveedorAcuerdoEntity source, Integer idProveedor, Integer empresaId) {
        if (source.getTipo() != null) target.setTipo(normalizeValue(source.getTipo()));
        if (source.getDescripcion() != null) target.setDescripcion(source.getDescripcion().trim());
        if (source.getFechaInicio() != null) target.setFechaInicio(source.getFechaInicio());
        if (source.getFechaVigencia() != null) target.setFechaVigencia(source.getFechaVigencia());
        if (source.getEstadoAcuerdo() != null) target.setEstadoAcuerdo(validateValue("estadoAcuerdo", source.getEstadoAcuerdo(), ESTADOS));
        if (source.getDocumentoRelacionado() != null) target.setDocumentoRelacionado(resolveDocumento(source.getDocumentoRelacionado(), idProveedor, empresaId));
        if (source.getNotas() != null) target.setNotas(trimToNull(source.getNotas()));
        if (source.getEstatus() != null && source.getEstadoAcuerdo() == null) {
            target.setEstadoAcuerdo(source.getEstatus() ? "ACTIVO" : "ARCHIVADO");
        }
    }

    private void normalize(ProveedorAcuerdoEntity obj) {
        obj.setTipo(isBlank(obj.getTipo()) ? "OTRO" : normalizeValue(obj.getTipo()));
        obj.setDescripcion(obj.getDescripcion().trim());
        obj.setEstadoAcuerdo(isBlank(obj.getEstadoAcuerdo()) ? "ACTIVO" : validateValue("estadoAcuerdo", obj.getEstadoAcuerdo(), ESTADOS));
        obj.setNotas(trimToNull(obj.getNotas()));
    }

    private ProveedorDocumentoEntity resolveDocumento(ProveedorDocumentoEntity documento, Integer idProveedor, Integer empresaId) {
        if (documento == null || documento.getIdProveedorDocumento() == null) return null;

        return documentoRepository.findByIdProveedorDocumentoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
                        documento.getIdProveedorDocumento(),
                        idProveedor,
                        empresaId
                )
                .orElseThrow(() -> new EntityNotFoundException("Documento relacionado no encontrado o no pertenece al proveedor"));
    }

    private void syncEstatus(ProveedorAcuerdoEntity obj) {
        obj.setEstatus("ACTIVO".equals(validateValue("estadoAcuerdo", obj.getEstadoAcuerdo(), ESTADOS)));
    }

    private EmpresasEntity empresa(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }

    private String validateValue(String field, String rawValue, Set<String> allowedValues) {
        String value = normalizeValue(rawValue);
        if (!allowedValues.contains(value)) {
            throw new IllegalArgumentException(field + " no es valido. Valores permitidos: " + allowedValues);
        }
        return value;
    }

    private String normalizeValue(String value) {
        return value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
