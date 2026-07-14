package com.galtekone.services;

import com.galtekone.dto.empresa.EmpresasDTO;
import com.galtekone.entity.EmpresasEntity;

public interface EmpresasService extends CommonService<EmpresasEntity>{

	EmpresasEntity readActual();

	EmpresasEntity updateActual(EmpresasDTO dto, String user);

}
