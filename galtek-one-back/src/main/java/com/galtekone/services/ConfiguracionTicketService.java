package com.galtekone.services;

import com.galtekone.dto.ticket.TicketConfigDTO;

public interface ConfiguracionTicketService {

    TicketConfigDTO readActual();

    TicketConfigDTO updateActual(TicketConfigDTO dto, String user);

    TicketConfigDTO restoreDefault(String user);
}
