package com.galtekone.services;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.galtekone.entity.CommonEntity;

public interface CommonService <T extends CommonEntity>{

	public T create(T obj, String user);
	
	public List<T> read(Specification<T> specs);
	
	public T update(T obj, String user);
	
	public T delete(Integer id, String user);
}
