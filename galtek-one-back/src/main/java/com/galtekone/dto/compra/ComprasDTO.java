package com.galtekone.dto.compra;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComprasDTO {
	
	private Integer idProveedor;
	private Integer idUsuario;
	private LocalDateTime fechaCompra;
	private BigDecimal totalCompra;
	private byte[] ticketProveedor;

}
