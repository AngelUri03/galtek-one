package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.LocalDeviceEntity;

@Repository
public interface LocalDeviceRepository extends JpaRepository<LocalDeviceEntity, String> {
}
