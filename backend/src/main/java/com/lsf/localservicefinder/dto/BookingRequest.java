package com.lsf.localservicefinder.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BookingRequest {
    @NotNull private Long providerId;
    @NotNull @Future(message = "Scheduled time must be in the future") private LocalDateTime scheduledAt;
    private String notes;
    @NotNull @Positive private Double estimatedHours; // used to compute estimatedAmount = hours * hourlyRate

    // Job location - optional. If omitted, BookingService falls back to the provider's
    // own registered address/coordinates so the "Get Directions" button always has something.
    private String jobAddress;
    private Double jobLatitude;
    private Double jobLongitude;
}
