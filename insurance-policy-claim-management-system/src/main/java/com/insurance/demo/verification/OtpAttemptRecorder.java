package com.insurance.demo.verification;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.config.AppSecurityProperties;
import com.insurance.demo.repository.OtpVerificationRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OtpAttemptRecorder {

	private final OtpVerificationRepository otpRepository;

	private final AppSecurityProperties securityProperties;

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void recordFailedAttempt(Long otpId) {
		otpRepository.findById(otpId).ifPresent(otp -> {
			int attempts = otp.getAttemptCount() != null ? otp.getAttemptCount() : 0;
			attempts++;
			otp.setAttemptCount(attempts);

			// The remaining-attempts count stays internal and is never exposed to the client.
			if (attempts >= securityProperties.getMaxOtpAttempts()) {
				otp.setUsed(true);
			}
			otpRepository.save(otp);
		});
	}

}
