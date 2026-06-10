package com.galtekone.services.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.utils.EmpresaValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.EntradasSalidasEntity;
import com.galtekone.repository.EntradasSalidasRepository;
import com.galtekone.services.EntradasSalidasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EntradasSalidasServiceImpl implements EntradasSalidasService {

    @Autowired
    private EntradasSalidasRepository entradasSalidasRepository;

    @Autowired
    private UsuariosRepository usuariosRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Override
    @Transactional
    public EntradasSalidasEntity create(EntradasSalidasEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar usuario pertenece a la empresa
        UsuariosEntity usuario = empresaValidator.validarEntidadPorEmpresa(
                obj.getUsuario().getIdUsuario(),
                empresaId,
                "Usuario",
                usuariosRepository::findByIdUsuarioAndEmpresa_IdEmpresa
        );

        obj.setUsuario(usuario);
        obj.setFechaHora(LocalDateTime.now());
        EmpresaValidator.asignarEmpresa(obj);
        obj.setUsuarioCreacion(user);

        return entradasSalidasRepository.save(obj);
    }

    @Override
    public List<EntradasSalidasEntity> read(Specification<EntradasSalidasEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<EntradasSalidasEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<EntradasSalidasEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return entradasSalidasRepository.findAll(finalSpec);
    }

    @Override
    @Transactional
    public EntradasSalidasEntity update(EntradasSalidasEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        EntradasSalidasEntity entityToUpdate = empresaValidator.validarEntidadPorEmpresa(
                obj.getIdRegistro(),
                empresaId,
                "Registro de entrada/salida",
                entradasSalidasRepository::findByIdRegistroAndEmpresa_IdEmpresa
        );

        if (obj.getTipo() != null) {
            entityToUpdate.setTipo(obj.getTipo());
        }

        if (obj.getUsuario() != null) {
            UsuariosEntity usuario = empresaValidator.validarEntidadPorEmpresa(
                    obj.getUsuario().getIdUsuario(),
                    empresaId,
                    "Usuario",
                    usuariosRepository::findByIdUsuarioAndEmpresa_IdEmpresa
            );
            entityToUpdate.setUsuario(usuario);
        }

        entityToUpdate.setUsuarioModificacion(user);

        return entradasSalidasRepository.save(entityToUpdate);
    }

    @Override
    @Transactional
    public EntradasSalidasEntity delete(Integer idRegistro, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Optional<EntradasSalidasEntity> optional = entradasSalidasRepository.findById(idRegistro);
        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Entrada/Salida no encontrada o no pertenece a tu empresa");
        }
        EntradasSalidasEntity entity = optional.get();
        entity.setUsuarioModificacion(user);
        entradasSalidasRepository.deleteById(idRegistro);
        return entity;
    }

}
