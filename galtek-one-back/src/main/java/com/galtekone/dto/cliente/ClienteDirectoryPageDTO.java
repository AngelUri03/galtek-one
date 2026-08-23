package com.galtekone.dto.cliente;

import java.util.List;

import lombok.Data;

@Data
public class ClienteDirectoryPageDTO {

    private List<ClienteDirectoryRowDTO> items;
    private Integer page;
    private Integer size;
    private Long totalRecords;
    private Integer totalPages;
    private Boolean first;
    private Boolean last;
    private ClienteDirectorySummaryDTO summary;
}
