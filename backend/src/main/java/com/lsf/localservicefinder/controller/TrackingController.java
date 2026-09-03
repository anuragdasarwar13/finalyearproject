package com.lsf.localservicefinder.controller;

import com.lsf.localservicefinder.dto.LocationPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class TrackingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/send-location")
    public void broadcastLocation(@Payload LocationPayload payload) {
        // Broadcasts directly to subscribers listening to: /topic/tracking/{bookingId}
        messagingTemplate.convertAndSend("/topic/tracking/" + payload.getBookingId(), payload);
    }
}
