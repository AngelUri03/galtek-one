package com.galtekone.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.galtekone.services.SessionService;

import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class DesktopSessionStartup {

    private final SessionService sessionService;

    @EventListener(ApplicationReadyEvent.class)
    public void revokePreviousDesktopSessions() {
        sessionService.revokeAll();
    }
}
