package com.insurance.demo.verification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

	private final JavaMailSender mailSender;

	@Value("${spring.mail.username}")
	private String fromEmail;

	@Value("${app.frontend.url}")
	private String frontendUrl;

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

		String title        = isStaff ? "Welcome to the Team!" : "Verify Your Email";
		String greeting     = isStaff ? "Your staff account has been created." : "Thank you for registering with us.";
		String subGreeting  = isStaff
				? "Please use the OTP below to verify your account and get started."
				: "Use the OTP below to complete your email verification.";

		String ctaButton = isStaff
				? "<a href=\"" + verifyLink + "\" "
				+ "style=\"display:inline-block;padding:14px 36px;background:#4F46E5;"
				+ "color:#ffffff;text-decoration:none;border-radius:8px;"
				+ "font-size:16px;font-weight:600;letter-spacing:0.5px;"
				+ "box-shadow:0 4px 12px rgba(79,70,229,0.4);\">"
				+ "Verify My Account &rarr;</a>"
				: "";

		String ctaSection = isStaff
				? "<tr><td style=\"padding:0 40px 32px;text-align:center;\">"
				+ ctaButton
				+ "<p style=\"margin-top:20px;font-size:13px;color:#9CA3AF;\">"
				+ "Or copy and paste this link into your browser:<br>"
				+ "<a href=\"" + verifyLink + "\" style=\"color:#4F46E5;word-break:break-all;\">"
				+ verifyLink + "</a></p>"
				+ "</td></tr>"
				: "";

		return "<!DOCTYPE html>"
			+ "<html lang=\"en\"><head><meta charset=\"UTF-8\">"
			+ "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">"
			+ "<title>" + title + "</title></head>"
			+ "<body style=\"margin:0;padding:0;background-color:#F3F4F6;"
			+ "font-family:'Segoe UI',Arial,sans-serif;\">"

			// Outer wrapper
			+ "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\""
			+ " style=\"background:#F3F4F6;padding:40px 0;\">"
			+ "<tr><td align=\"center\">"

			// Card
			+ "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\""
			+ " style=\"max-width:600px;background:#FFFFFF;border-radius:16px;"
			+ "overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);\">"

			// ── Header ──
			+ "<tr><td style=\"background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);"
			+ "padding:40px;text-align:center;\">"
			+ "<h1 style=\"margin:0;color:#FFFFFF;font-size:26px;font-weight:700;"
			+ "letter-spacing:-0.5px;\">\uD83D\uDEE1\uFE0F Insurance Portal</h1>"
			+ "<p style=\"margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;\">"
			+ "Secure Account Verification</p>"
			+ "</td></tr>"

			// ── Greeting ──
			+ "<tr><td style=\"padding:40px 40px 24px;\">"
			+ "<h2 style=\"margin:0 0 8px;color:#1F2937;font-size:22px;font-weight:700;\">"
			+ title + "</h2>"
			+ "<p style=\"margin:0;color:#6B7280;font-size:15px;line-height:1.6;\">"
			+ greeting + " " + subGreeting + "</p>"
			+ "</td></tr>"

			// ── OTP Box ──
			+ "<tr><td style=\"padding:0 40px 32px;\">"
			+ "<div style=\"background:#F5F3FF;border:2px dashed #C4B5FD;"
			+ "border-radius:12px;padding:28px;text-align:center;\">"
			+ "<p style=\"margin:0 0 8px;color:#7C3AED;font-size:13px;"
			+ "font-weight:600;text-transform:uppercase;letter-spacing:1px;\">Your OTP Code</p>"
			+ "<div style=\"font-size:42px;font-weight:800;letter-spacing:12px;"
			+ "color:#4F46E5;font-family:monospace;\">" + otp + "</div>"
			+ "<p style=\"margin:12px 0 0;color:#9CA3AF;font-size:13px;\">"
			+ "\u23F1\uFE0F This OTP is valid for <strong>5 minutes</strong></p>"
			+ "</div>"
			+ "</td></tr>"

			// ── CTA Button (staff only) ──
			+ ctaSection

			// ── Warning ──
			+ "<tr><td style=\"padding:0 40px 32px;\">"
			+ "<div style=\"background:#FEF9C3;border-left:4px solid #F59E0B;"
			+ "border-radius:0 8px 8px 0;padding:14px 16px;\">"
			+ "<p style=\"margin:0;color:#92400E;font-size:13px;line-height:1.6;\">"
			+ "\u26A0\uFE0F <strong>Security Notice:</strong> Never share this OTP with anyone. "
			+ "Our team will never ask for your OTP.</p>"
			+ "</div></td></tr>"

			// ── Footer ──
			+ "<tr><td style=\"background:#F9FAFB;border-top:1px solid #E5E7EB;"
			+ "padding:24px 40px;text-align:center;\">"
			+ "<p style=\"margin:0;color:#9CA3AF;font-size:12px;line-height:1.6;\">"
			+ "This is an automated message from <strong>Insurance Portal</strong>.<br>"
			+ "If you did not request this, please ignore this email or contact support."
			+ "</p>"
			+ "</td></tr>"

			+ "</table>"  // end card
			+ "</td></tr></table>"  // end outer wrapper
			+ "</body></html>";
	}
}