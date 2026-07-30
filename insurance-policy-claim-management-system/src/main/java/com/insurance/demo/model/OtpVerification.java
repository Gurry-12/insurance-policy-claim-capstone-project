package com.insurance.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false)
    private String emailOtp;

    @Column(nullable = false)
    private String phoneOtp;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private boolean used;

    @Column(nullable = false, columnDefinition = "int default 1")
    private int sendCount = 1;

    private LocalDateTime lastSentAt;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        lastSentAt = LocalDateTime.now();
    }
}
