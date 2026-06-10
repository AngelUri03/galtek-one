package com.galtekone.services;

import com.galtekone.dto.venta.CreateVentaRequest;
import com.galtekone.dto.venta.TicketVentaResponse;
import com.galtekone.entity.VentasEntity;

public interface VentasService extends CommonService<VentasEntity>{
        TicketVentaResponse generarVenta(CreateVentaRequest request, String user);

}
