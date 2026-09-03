package com.lsf.localservicefinder.dto;

import com.lsf.localservicefinder.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusUpdateRequest {
    private BookingStatus status;
    private Double finalAmount;
}
