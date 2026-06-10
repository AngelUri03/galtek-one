package com.galtekone.services;

import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.entity.ClientesEntity;

public interface ClientesService extends CommonService<ClientesEntity>{ 
	
	ClienteConPedidosDTO readById(Integer idCliente);

}
