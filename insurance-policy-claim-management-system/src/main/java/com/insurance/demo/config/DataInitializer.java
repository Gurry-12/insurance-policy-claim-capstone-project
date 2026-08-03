package com.insurance.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.repository.AppUserRepository;

@Configuration
public class DataInitializer {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	@Bean
	CommandLineRunner initAdminData(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
			AppSecurityProperties securityProperties) {
		return args -> {

			if (!securityProperties.isSeedAdminEnabled()) {
				log.info("Admin seeding disabled (app.security.seed-admin.enabled=false).");
				return;
			}

			if (userRepository.findByEmail("admin@insurance.com").isEmpty()) {

				AppUser admin = new AppUser();
				admin.setFullName("System Administrator");
				admin.setEmail("admin@insurance.com");
				admin.setPassword(passwordEncoder.encode("Admin@123"));
				admin.setMobileNumber("9876543210");
				admin.setIsActive(true);
				admin.setEmailVerified(true);
				admin.setPhoneVerified(true);
				admin.setRole(Role.ROLE_ADMIN);
				admin.setTokenVersion(0L);

				userRepository.save(admin);

				log.info("Default admin user created successfully (admin@insurance.com). "
						+ "Change the default password immediately.");
			} else {
				log.info("Admin user already exists.");
			}
		};
	}
}
