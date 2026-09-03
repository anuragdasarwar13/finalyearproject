package com.lsf.localservicefinder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInitResponse {
    private Long paymentId;
    private Long bookingId;
    private Double amount;
    private String providerName;
    private String providerUpiVpa;
    private String upiIntentUrl;
    private String qrCodeBase64;
}