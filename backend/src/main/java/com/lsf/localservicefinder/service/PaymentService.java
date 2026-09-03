package com.lsf.localservicefinder.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lsf.localservicefinder.dto.PaymentConfirmRequest;
import com.lsf.localservicefinder.dto.PaymentInitResponse;
import com.lsf.localservicefinder.entity.*;
import com.lsf.localservicefinder.repository.BookingRepository;
import com.lsf.localservicefinder.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public PaymentInitResponse initiatePayment(Long bookingId, Long customerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: This booking does not belong to you.");
        }

        // Allow payments for CONFIRMED, IN_PROGRESS, or COMPLETED bookings
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot pay for a cancelled booking.");
        }

        // Determine effective payable amount safely
        Double payableAmount = booking.getEstimatedAmount();
        if (payableAmount == null || payableAmount <= 0) {
            payableAmount = 100.0; // Fallback safe base rate
        }

        ServiceProvider provider = booking.getProvider();
        String upiVpa = provider.getUpiVpa();
        if (upiVpa == null || upiVpa.trim().isEmpty()) {
            upiVpa = "9325145073@axl"; // Default fallback
        }

        String providerName = (provider.getUser() != null && provider.getUser().getFullName() != null)
                ? provider.getUser().getFullName()
                : "Service Specialist";

        String upiUrl = String.format(
                "upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR&tn=Booking_%d",
                upiVpa.trim(),
                URLEncoder.encode(providerName, StandardCharsets.UTF_8),
                payableAmount,
                booking.getId()
        );

        String qrBase64 = generateQrCodeBase64(upiUrl, 300, 300);

        // Safe fetch or create without throwing duplicate key errors
        Double finalAmount = payableAmount;
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseGet(() -> Payment.builder()
                        .booking(booking)
                        .amount(finalAmount)
                        .status(PaymentStatus.PENDING)
                        .transactionRef("TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8))
                        .createdAt(LocalDateTime.now())
                        .build());

        // Update amount in case the provider modified the bill
        payment.setAmount(payableAmount);
        if (payment.getTransactionRef() == null) {
            payment.setTransactionRef("TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8));
        }
        payment = paymentRepository.save(payment);

        return PaymentInitResponse.builder()
                .paymentId(payment.getId())
                .bookingId(booking.getId())
                .amount(payment.getAmount())
                .providerName(providerName)
                .providerUpiVpa(upiVpa)
                .upiIntentUrl(upiUrl)
                .qrCodeBase64(qrBase64)
                .build();
    }

    @Transactional
    public Payment confirmPayment(Long paymentId, Long customerId, PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!payment.getBooking().getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: You cannot confirm payment for this booking.");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }

        if (request.getUtrNumber() == null || request.getUtrNumber().trim().isEmpty()) {
            throw new RuntimeException("A valid UTR / transaction reference number is required.");
        }

        payment.setUtrNumber(request.getUtrNumber().trim());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        // Update booking status
        Booking booking = payment.getBooking();
        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        return payment;
    }

    public Payment getPaymentByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("No payment found for booking: " + bookingId));
    }

    private String generateQrCodeBase64(String text, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngData = outputStream.toByteArray();
            return Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate UPI QR code: " + e.getMessage(), e);
        }
    }
}