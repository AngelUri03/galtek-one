package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.dto.cliente.PedidoClienteDTO;
import com.galtekone.entity.ClientesEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.repository.ClientesRepository;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.ClientesService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ClientesServiceImpl implements ClientesService {

    @Autowired
    private ClientesRepository clientesRepository;

    @Autowired
    private EmpresasRepository empresasRepository;

    @Autowired
    private VentasRepository ventasRepository;

    @Override
    public ClientesEntity create(ClientesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);

        return clientesRepository.save(obj);
    }

    @Override
    public List<ClientesEntity> read(Specification<ClientesEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ClientesEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ClientesEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return clientesRepository.findAll(finalSpec);
    }

    @Override
    public ClientesEntity update(ClientesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<ClientesEntity> aux = clientesRepository.findById(obj.getIdCliente());

        if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Cliente no encontrado o no pertenece a tu empresa");
        }

        ClientesEntity entityToUpdate = aux.get();

        if (obj.getNombre() != null) {
            entityToUpdate.setNombre(obj.getNombre());
        }
        if (obj.getEmail() != null) {
            entityToUpdate.setEmail(obj.getEmail());
        }
        if (obj.getTelefono() != null) {
            entityToUpdate.setTelefono(obj.getTelefono());
        }
        if (obj.getDireccion() != null) {
            entityToUpdate.setDireccion(obj.getDireccion());
        }
        if (obj.getAvatar() != null) {
            entityToUpdate.setAvatar(obj.getAvatar());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return clientesRepository.save(entityToUpdate);
    }

    @Override
    public ClientesEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Optional<ClientesEntity> optional = clientesRepository.findById(id);

        if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new EntityNotFoundException("Cliente no encontrado o no pertenece a tu empresa");
        }

        ClientesEntity entity = optional.get();
        entity.setUsuarioModificacion(user);

        clientesRepository.deleteById(id);

        return entity;
    }

    @Override
    @Transactional
    public ClienteConPedidosDTO readById(Integer idCliente) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        ClientesEntity cliente = clientesRepository.findByIdCliente(idCliente)
                .filter(c -> c.getEmpresa().getIdEmpresa().equals(empresaId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));

        List<PedidoClienteDTO> pedidos = cliente.getPedidos().stream().map(venta -> {

            Integer productosTotales = venta.getDetalles().size();

            BigDecimal importeTotal = BigDecimal.valueOf(venta.getTotal())
                    .setScale(2, RoundingMode.HALF_UP);



            return new PedidoClienteDTO(
                    "Pedido #" + venta.getIdVenta(),
                    venta.getFechaCreacion().toLocalDate(),
                    productosTotales,
                    importeTotal
            );
        }).toList();

        return new ClienteConPedidosDTO(
                cliente.getIdCliente(),
                cliente.getNombre(),
                cliente.getEmail(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getAvatar(),
                pedidos
        );
    }


}
