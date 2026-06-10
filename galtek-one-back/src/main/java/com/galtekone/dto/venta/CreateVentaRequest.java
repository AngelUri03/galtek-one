package com.galtekone.dto.venta;

import lombok.Data;

import java.util.List;

@Data
public class CreateVentaRequest {

    private Integer clienteId;
    private Integer metodoPagoId;
    private Integer cajaId;
    private Integer almacenId;
    private List<ItemVentaRequest> productos;
}
