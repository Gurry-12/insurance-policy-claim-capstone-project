package com.insurance.demo.verification;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.OtpVerification;
import com.insurance.demo.repository.OtpVerificationRepository;
import com.insurance.demo.util.MessageConstants;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OtpService {

	private final OtpVerificationRepository otpRepository;
	private final EmailService emailService;
	private final SmsService smsService;
	private final OtpAttemptRecorder otpAttemptRecorder;
	private final SecureRandom secureRandom = new SecureRandom();

	@Value("${app.otp.expiry-minutes}")
	private long expiryMinutes;

	@Transactional
	public void createAndSendOtp(AppUser user) {
		String emailOtp = generateSixDigitOtp();
		String phoneOtp = generateSixDigitOtp();

		OtpVerification otpVerification = OtpVerification.builder().user(user).emailOtp(emailOtp).phoneOtp(phoneOtp)
				.expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes)).used(false).sendCount(1).build();

		otpRepository.save(otpVerification);
		boolean isStaff = Role.ROLE_INTERNAL_STAFF.equals(user.getRole());
		emailService.sendOtp(user.getEmail(), emailOtp, isStaff);
		smsService.sendOtp(user.getMobileNumber(), phoneOtp);
	}

	@Transactional
	public void sendOrResendOtp(AppUser user) {
		int totalSends = otpRepository.getTotalOtpSendsSince(user, LocalDateTime.now().minusHours(24));
		if (totalSends >= 4) {
			throw new BadRequestException(com.insurance.demo.util.MessageConstants.Auth.OTP_LIMIT_EXCEEDED);
		}

		otpRepository.findTopByUserOrderByCreatedAtDesc(user).ifPresentOrElse(latestOtp -> {
			if (latestOtp.getLastSentAt() != null && latestOtp.getLastSentAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
				throw new BadRequestException(com.insurance.demo.util.MessageConstants.Auth.OTP_RETRY_WAIT);
			}

			if (!latestOtp.isUsed() && latestOtp.getExpiresAt().isAfter(LocalDateTime.now())) {
				// Resend existing active OTP
				latestOtp.setSendCount(latestOtp.getSendCount() + 1);
				latestOtp.setLastSentAt(LocalDateTime.now());
				otpRepository.save(latestOtp);

				boolean isStaff = Role.ROLE_INTERNAL_STAFF.equals(user.getRole());
				emailService.sendOtp(user.getEmail(), latestOtp.getEmailOtp(), isStaff);
				smsService.sendOtp(user.getMobileNumber(), latestOtp.getPhoneOtp());
			} else {
				// Create new if expired or used
				createAndSendOtp(user);
			}
		}, () -> {
			// No previous OTP exists, create new
			createAndSendOtp(user);
		});
	}

	@Transactional
	public void verifyOtp(AppUser user, String emailOtp, String phoneOtp) {

		OtpVerification latestOtp = otpRepository.findTopByUserOrderByCreatedAtDesc(user)

				.orElseThrow(() -> new BadRequestException(MessageConstants.Auth.OTP_NOT_FOUND));

		if (latestOtp.isUsed()) {
			throw new BadRequestException(MessageConstants.Auth.OTP_NOT_FOUND);
		}

		if (latestOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new BadRequestException(MessageConstants.Auth.OTP_EXPIRED);
		}

		if (!latestOtp.getEmailOtp().equals(emailOtp)) {
			otpAttemptRecorder.recordFailedAttempt(latestOtp.getId());
			throw new BadRequestException(MessageConstants.Auth.INVALID_EMAIL_OTP);
		}

		if (!latestOtp.getPhoneOtp().equals(phoneOtp)) {
			otpAttemptRecorder.recordFailedAttempt(latestOtp.getId());
			throw new BadRequestException(MessageConstants.Auth.INVALID_PHONE_OTP);
		}

		latestOtp.setUsed(true);
		latestOtp.setAttemptCount(0);
		otpRepository.save(latestOtp);
	}

	private String generateSixDigitOtp() {
		int number = secureRandom.nextInt(900000) + 100000;
		return String.valueOf(number);
	}

}
