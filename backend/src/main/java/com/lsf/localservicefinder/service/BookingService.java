package com.lsf.localservicefinder.service;

import com.lsf.localservicefinder.dto.BookingRequest;
import com.lsf.localservicefinder.dto.BookingStatusUpdateRequest;
import com.lsf.localservicefinder.entity.*;
import com.lsf.localservicefinder.repository.BookingRepository;
import com.lsf.localservicefinder.repository.PaymentRepository;
import com.lsf.localservicefinder.repository.ServiceProviderRepository;
import com.lsf.localservicefinder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public Booking createBooking(Long customerId, BookingRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        if (customer.getRole() != Role.CUSTOMER) {
            throw new RuntimeException("Only customer accounts can make bookings.");
        }

        ServiceProvider provider = serviceProviderRepository.findById(request.getProviderId())
                .or(() -> serviceProviderRepository.findByUserId(request.getProviderId()))
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + request.getProviderId()));

        if (!Boolean.TRUE.equals(provider.getAvailable())) {
            throw new RuntimeException("Provider is currently not accepting bookings.");
        }

        double hours = (request.getEstimatedHours() != null && request.getEstimatedHours() > 0)
                ? request.getEstimatedHours()
                : 1.0;
        double calculatedAmount = hours * (provider.getHourlyRate() != null ? provider.getHourlyRate() : 100.0);

        String jobAddress = (request.getJobAddress() != null && !request.getJobAddress().isBlank())
                ? request.getJobAddress() : provider.getAddress();
        Double jobLat = request.getJobLatitude() != null ? request.getJobLatitude() : provider.getLatitude();
        Double jobLng = request.getJobLongitude() != null ? request.getJobLongitude() : provider.getLongitude();

        Booking booking = Booking.builder()
                .customer(customer)
                .provider(provider)
                .scheduledAt(request.getScheduledAt())
                .estimatedHours(hours)
                .estimatedAmount(calculatedAmount)
                .notes(request.getNotes())
                .jobAddress(jobAddress)
                .jobLatitude(jobLat)
                .jobLongitude(jobLng)
                .status(BookingStatus.PENDING)
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateStatus(Long bookingId, Long userId, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        boolean isCustomer = booking.getCustomer().getId().equals(userId);
        boolean isProvider = booking.getProvider().getUser().getId().equals(userId);

        if (!isCustomer && !isProvider && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("You are not authorized to update this booking.");
        }

        BookingStatus currentStatus = booking.getStatus();
        BookingStatus targetStatus = request.getStatus();

        if (targetStatus == null) {
            throw new RuntimeException("Status must not be null.");
        }

        if (targetStatus == BookingStatus.CANCELLED) {
            if (currentStatus == BookingStatus.COMPLETED) {
                throw new RuntimeException("Cannot cancel a completed booking.");
            }
        } else if (isProvider) {
            if (targetStatus == BookingStatus.CONFIRMED && currentStatus != BookingStatus.PENDING) {
                throw new RuntimeException("Only pending bookings can be confirmed.");
            }
            if (targetStatus == BookingStatus.REJECTED && currentStatus != BookingStatus.PENDING) {
                throw new RuntimeException("Only pending bookings can be rejected.");
            }
            if (targetStatus == BookingStatus.COMPLETED) {
                if (currentStatus != BookingStatus.CONFIRMED && currentStatus != BookingStatus.COMPLETED) {
                    throw new RuntimeException("Only confirmed bookings can be marked as completed.");
                }

                // Check final amount from any of the possible DTO getters
                Double newAmount = request.getFinalAmount();
                if (newAmount != null && newAmount > 0) {
                    booking.setEstimatedAmount(newAmount);

                    // Also update the pending payment if one was already generated
                    paymentRepository.findByBookingId(bookingId).ifPresent(p -> {
                        if (p.getStatus() != PaymentStatus.SUCCESS) {
                            p.setAmount(newAmount);
                            paymentRepository.save(p);
                        }
                    });
                }
            }
        } else if (isCustomer && targetStatus != BookingStatus.CANCELLED) {
            throw new RuntimeException("Customers can only cancel bookings.");
        }

        booking.setStatus(targetStatus);
        return bookingRepository.save(booking);
    }

    public List<Booking> getCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public List<Booking> getProviderBookings(Long providerUserId) {
        ServiceProvider provider = serviceProviderRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new RuntimeException("No provider profile found for user id: " + providerUserId));
        return bookingRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId());
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
    }
}