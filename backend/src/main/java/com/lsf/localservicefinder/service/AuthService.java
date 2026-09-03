package com.lsf.localservicefinder.service;

import com.lsf.localservicefinder.dto.AuthResponse;
import com.lsf.localservicefinder.dto.LoginRequest;
import com.lsf.localservicefinder.dto.RegisterRequest;
import com.lsf.localservicefinder.entity.*;
import com.lsf.localservicefinder.repository.*;
import com.lsf.localservicefinder.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail().trim().toLowerCase()).isPresent()) {
            throw new RuntimeException("An account with this email already exists.");
        }

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail().trim().toLowerCase())
                .phone(req.getPhone())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .build();

        user = userRepository.save(user);

        if (req.getRole() == Role.PROVIDER) {
            ServiceCategory category = null;
            if (req.getCategoryId() != null) {
                category = categoryRepository.findById(req.getCategoryId()).orElse(null);
            }
            if (category == null) {
                category = categoryRepository.findAll().stream().findFirst().orElse(null);
            }

            ServiceProvider provider = ServiceProvider.builder()
                    .user(user)
                    .category(category)
                    .bio(req.getBio() != null && !req.getBio().isBlank() ? req.getBio() : "Professional service provider")
                    .hourlyRate(req.getHourlyRate() != null && req.getHourlyRate() > 0 ? req.getHourlyRate() : 100.0)
                    .latitude(req.getLatitude() != null ? req.getLatitude() : 18.5204)
                    .longitude(req.getLongitude() != null ? req.getLongitude() : 73.8567)
                    .address(req.getAddress() != null && !req.getAddress().isBlank() ? req.getAddress() : "Pune, Maharashtra")
                    .upiVpa(req.getUpiVpa() != null && !req.getUpiVpa().isBlank() ? req.getUpiVpa().trim() : "servicepay@upi")
                    .available(true)
                    .rating(5.0)
                    .totalReviews(0)
                    .build();

            provider = serviceProviderRepository.save(provider);

            List<AvailabilitySlot> slots = new ArrayList<>();
            for (DayOfWeek day : DayOfWeek.values()) {
                if (day != DayOfWeek.SUNDAY) {
                    slots.add(AvailabilitySlot.builder()
                            .provider(provider)
                            .dayOfWeek(day)
                            .startTime(LocalTime.of(9, 0))
                            .endTime(LocalTime.of(18, 0))
                            .build());
                }
            }
            availabilitySlotRepository.saveAll(slots);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}