package com.galtekone.dto.cliente;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class PedidoClienteDTO {

	private String noOrden;
	private LocalDate fecha;
	private Integer productosTotales;
	private BigDecimal importeTotal;
	private String metodoPago;
	private String estado;
	private List<DetallePedidoClienteDTO> productos;


}
