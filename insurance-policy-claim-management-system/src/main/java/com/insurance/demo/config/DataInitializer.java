package com.insurance.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.repository.AppUserRepository;

@Configuration
public class DataInitializer {

	@Bean
	CommandLineRunner initAdminData(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
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

				userRepository.save(admin);

				System.out.println(" Default Admin user created successfully!");
				System.out.println("Email    : admin@insurance.com");
			} else {
				System.out.println(" Admin user already exists.");
			}
		};
	}
}
