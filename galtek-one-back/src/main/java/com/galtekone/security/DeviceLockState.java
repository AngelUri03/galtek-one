package com.galtekone.security;

import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@Getter
@Setter
public class DeviceLockState {
    private boolean locked = false;
    private String lockReason = "";
}
