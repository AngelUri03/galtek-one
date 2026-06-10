package com.galtekone.dto.cliente;

import java.util.List;

import lombok.*;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClienteConPedidosDTO {
	
	    private Integer idCliente;
	    private String nombre;
	    private String email;
	    private String telefono;
	    private String direccion;
	    private String avatar;
	    private List<PedidoClienteDTO> pedidos;

}
