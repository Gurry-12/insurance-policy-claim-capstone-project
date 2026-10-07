package com.insurance.demo.verification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

	private final JavaMailSender mailSender;
	private final TemplateEngine templateEngine;

	@Value("${spring.mail.username}")
	private String fromEmail;

	@Value("${app.frontend.url}")
	private String frontendUrl;

	@Value("${app.otp.expiry-minutes:5}")
	private long expiryMinutes;

	public void sendOtp(String toEmail, String otp, boolean isStaff) {

		if (!StringUtils.hasText(fromEmail)) {
			throw new IllegalStateException("Email service is not configured. Please set spring.mail.username.");
		}

		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

			helper.setFrom(fromEmail.trim());
			helper.setTo(toEmail);
			helper.setSubject(isStaff ? "Welcome! Verify Your Staff Account" : "Your Email Verification OTP");

			String messageContent = buildEmailHtml(toEmail, otp, isStaff);
			helper.setText(messageContent, true);

			mailSender.send(message);

		} catch (MessagingException | MailException ex) {
			Throwable rootCause = ex;

			while (rootCause.getCause() != null) {
				rootCause = rootCause.getCause();
			}

			rootCause.printStackTrace();

			throw new IllegalStateException("Unable to send email OTP. Root cause: "
					+ rootCause.getClass().getSimpleName() + " - " + rootCause.getMessage(), ex);
		}
	}

	private String buildEmailHtml(String toEmail, String otp, boolean isStaff) {
		String encodedEmail = java.net.URLEncoder.encode(toEmail, java.nio.charset.StandardCharsets.UTF_8);
		String verifyLink = frontendUrl + "/verify-otp?email=" + encodedEmail;

		String title = isStaff ? "Welcome to the Team!" : "Verify Your Email";
		String greeting = isStaff ? "Your staff account has been created." : "Thank you for registering with us.";
		String subGreeting = isStaff
				? "Please use the OTP below to verify your account and get started."
				: "Use the OTP below to complete your email verification.";

		Context context = new Context();
		context.setVariable("title", title);
		context.setVariable("greeting", greeting);
		context.setVariable("subGreeting", subGreeting);
		context.setVariable("otp", otp);
		context.setVariable("isStaff", isStaff);
		context.setVariable("verifyLink", verifyLink);
		context.setVariable("expiryMinutes", expiryMinutes);

		return templateEngine.process("email/otp-verification", context);
	}
}