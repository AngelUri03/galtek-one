package com.galtekone.services;

import java.util.Map;

import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.entity.ClientesEntity;

public interface ClientesService extends CommonService<ClientesEntity>{ 
	
	ClienteConPedidosDTO readById(Integer idCliente);

	ClientesEntity changeEstado(Integer idCliente, String estadoCliente, String motivo, String user);

	Map<String, Object> deletePolicy(Integer idCliente);

	ClientesEntity delete(Integer idCliente, String motivo, String user);

}
