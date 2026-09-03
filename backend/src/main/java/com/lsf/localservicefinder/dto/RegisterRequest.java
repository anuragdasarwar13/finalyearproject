package com.lsf.localservicefinder.dto;

import com.lsf.localservicefinder.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String phone;

    @NotNull(message = "Role is required (CUSTOMER or PROVIDER)")
    private Role role;

    // Optional provider profile parameters
    private Long categoryId;
    private String bio;
    private Double hourlyRate;
    private String upiVpa;
    private Double latitude;
    private Double longitude;
    private String address;
}