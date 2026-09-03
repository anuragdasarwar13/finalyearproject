package com.lsf.localservicefinder.controller;

import com.lsf.localservicefinder.dto.BookingRequest;
import com.lsf.localservicefinder.dto.BookingStatusUpdateRequest;
import com.lsf.localservicefinder.entity.Booking;
import com.lsf.localservicefinder.security.AuthenticatedUser;
import com.lsf.localservicefinder.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public Booking create(@Valid @RequestBody BookingRequest request) {
        AuthenticatedUser me = currentUser();
        return bookingService.createBooking(me.userId(), request);
    }

    @PatchMapping("/{id}/status")
    public Booking updateStatus(@PathVariable Long id, @Valid @RequestBody BookingStatusUpdateRequest request) {
        AuthenticatedUser me = currentUser();
        return bookingService.updateStatus(id, me.userId(), request);
    }

    @GetMapping("/{id}")
    public Booking getOne(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    /** Bookings the logged-in customer has made. */
    @GetMapping("/my")
    public List<Booking> myBookings() {
        AuthenticatedUser me = currentUser();
        return bookingService.getCustomerBookings(me.userId());
    }

    /** Bookings received by the logged-in provider. */
    @GetMapping("/received")
    public List<Booking> receivedBookings() {
        AuthenticatedUser me = currentUser();
        return bookingService.getProviderBookings(me.userId());
    }

    private AuthenticatedUser currentUser() {
        return (AuthenticatedUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}