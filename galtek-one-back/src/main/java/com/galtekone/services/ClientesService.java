package com.galtekone.services;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;

import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.dto.cliente.ClienteDirectoryPageDTO;
import com.galtekone.entity.ClientesEntity;

public interface ClientesService extends CommonService<ClientesEntity>{ 

	Page<ClientesEntity> readPage(Specification<ClientesEntity> specs, int page, int size, String sort, String direction);

	ClienteDirectoryPageDTO readDirectoryPage(Map<String, String> filters, int page, int size, String sort, String direction);
	
	ClienteConPedidosDTO readById(Integer idCliente);

	ClientesEntity changeEstado(Integer idCliente, String estadoCliente, String motivo, String user);

	Map<String, Object> deletePolicy(Integer idCliente);

	ClientesEntity delete(Integer idCliente, String motivo, String user);

}
