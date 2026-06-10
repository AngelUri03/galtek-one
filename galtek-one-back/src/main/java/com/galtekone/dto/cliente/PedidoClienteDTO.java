package com.galtekone.dto.cliente;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@RequiredArgsConstructor

public class PedidoClienteDTO {

	private String noOrden;
	private LocalDate fecha;
	private Integer productosTotales;
	private BigDecimal importeTotal;


}
