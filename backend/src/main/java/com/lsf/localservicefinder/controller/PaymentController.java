package com.lsf.localservicefinder.controller;

import com.lsf.localservicefinder.dto.PaymentConfirmRequest;
import com.lsf.localservicefinder.dto.PaymentInitResponse;
import com.lsf.localservicefinder.entity.Payment;
import com.lsf.localservicefinder.security.AuthenticatedUser;
import com.lsf.localservicefinder.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/bookings/{bookingId}/initiate")
    public PaymentInitResponse initiate(@PathVariable Long bookingId) {
        AuthenticatedUser me = (AuthenticatedUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return paymentService.initiatePayment(bookingId, me.userId());
    }

    @PostMapping("/{paymentId}/confirm")
    public Payment confirm(@PathVariable Long paymentId, @Valid @RequestBody PaymentConfirmRequest request) {
        AuthenticatedUser me = (AuthenticatedUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return paymentService.confirmPayment(paymentId, me.userId(), request);
    }

    @GetMapping("/bookings/{bookingId}")
    public Payment getByBooking(@PathVariable Long bookingId) {
        return paymentService.getPaymentByBookingId(bookingId);
    }
}