package com.insurance.demo.verification;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

	@Mock
	private JavaMailSender mailSender;

	private TemplateEngine templateEngine;
	private EmailService emailService;

	@BeforeEach
	void setUp() {
		// Set up actual Thymeleaf template engine pointing to classpath templates
		ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
		templateResolver.setPrefix("templates/");
		templateResolver.setSuffix(".html");
		templateResolver.setTemplateMode(TemplateMode.HTML);
		templateResolver.setCharacterEncoding("UTF-8");
		templateResolver.setCacheable(false);

		SpringTemplateEngine springTemplateEngine = new SpringTemplateEngine();
		springTemplateEngine.setTemplateResolver(templateResolver);
		this.templateEngine = springTemplateEngine;

		this.emailService = new EmailService(mailSender, templateEngine);
		ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@insurance.com");
		ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
		ReflectionTestUtils.setField(emailService, "expiryMinutes", 5L);
	}

	@Test
	@DisplayName("Should send customer OTP email rendered via Thymeleaf")
	void testSendCustomerOtpEmail() throws Exception {
		MimeMessage mimeMessage = new MimeMessage((Session) null);
		when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
		doNothing().when(mailSender).send(any(MimeMessage.class));

		assertDoesNotThrow(() -> emailService.sendOtp("customer@example.com", "654321", false));

		ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
		verify(mailSender).send(captor.capture());

		MimeMessage sentMessage = captor.getValue();
		String content = extractTextFromMessage(sentMessage);

		assertTrue(content.contains("654321"), "Email should contain OTP code");
		assertTrue(content.contains("Verify Your Email"), "Email should contain customer title");
		assertTrue(content.contains("5 minutes"), "Email should mention 5 minutes validity");
		assertTrue(!content.contains("Verify My Account &rarr;"), "Customer email should not show staff CTA button");
	}

	@Test
	@DisplayName("Should send staff OTP email with verification CTA rendered via Thymeleaf")
	void testSendStaffOtpEmail() throws Exception {
		MimeMessage mimeMessage = new MimeMessage((Session) null);
		when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
		doNothing().when(mailSender).send(any(MimeMessage.class));

		assertDoesNotThrow(() -> emailService.sendOtp("staff@example.com", "987654", true));

		ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
		verify(mailSender).send(captor.capture());

		MimeMessage sentMessage = captor.getValue();
		String content = extractTextFromMessage(sentMessage);

		assertTrue(content.contains("987654"), "Email should contain OTP code");
		assertTrue(content.contains("Welcome to the Team!"), "Email should contain staff title");
		assertTrue(content.contains("Verify My Account"), "Staff email should contain verification button");
		assertTrue(content.contains("http://localhost:5173/verify-otp?email=staff%40example.com"), "Staff email should contain formatted verification link");
	}

	@Test
	@DisplayName("Should throw exception if fromEmail is not configured")
	void testMissingFromEmailThrowsException() {
		ReflectionTestUtils.setField(emailService, "fromEmail", "");

		assertThrows(IllegalStateException.class, () -> emailService.sendOtp("test@example.com", "123456", false));
	}

	private String extractTextFromMessage(jakarta.mail.Part part) throws Exception {
		Object content = part.getContent();
		if (content instanceof String) {
			return (String) content;
		}
		if (content instanceof jakarta.mail.Multipart) {
			jakarta.mail.Multipart mp = (jakarta.mail.Multipart) content;
			StringBuilder sb = new StringBuilder();
			for (int i = 0; i < mp.getCount(); i++) {
				sb.append(extractTextFromMessage(mp.getBodyPart(i)));
			}
			return sb.toString();
		}
		return "";
	}
}
