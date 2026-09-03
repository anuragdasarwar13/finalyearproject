package com.lsf.localservicefinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationPayload {
    private Long bookingId;
    private Long providerId;
    private Double latitude;
    private Double longitude;
    private Double heading; // Direction in degrees for vehicle rotation
}