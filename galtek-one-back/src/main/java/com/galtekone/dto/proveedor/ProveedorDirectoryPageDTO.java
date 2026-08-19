package com.galtekone.dto.proveedor;

import java.util.List;

import lombok.Data;

@Data
public class ProveedorDirectoryPageDTO {

    private List<ProveedorDirectoryRowDTO> items;
    private Integer page;
    private Integer size;
    private Long totalRecords;
    private Integer totalPages;
    private Boolean first;
    private Boolean last;
    private ProveedorDirectorySummaryDTO summary;
}
