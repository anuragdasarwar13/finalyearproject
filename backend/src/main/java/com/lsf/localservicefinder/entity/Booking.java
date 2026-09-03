package com.lsf.localservicefinder.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_id", nullable = false)
    private ServiceProvider provider;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    private Double estimatedHours;

    @Column(name = "estimated_amount", nullable = false)
    private Double totalAmount;

    @Column(length = 1000)
    private String notes;

    @Column(name = "job_address")
    private String jobAddress;

    private Double jobLatitude;

    private Double jobLongitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @OneToOne(mappedBy = "booking", fetch = FetchType.EAGER)
    @JsonIgnoreProperties("booking")
    private Payment payment;

    @CreationTimestamp
    private LocalDateTime createdAt;
}