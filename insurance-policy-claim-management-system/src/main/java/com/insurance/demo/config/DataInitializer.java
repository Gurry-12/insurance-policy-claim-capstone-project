package com.insurance.demo.config;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.insurance.demo.enums.ProductType;
import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Customer;
import com.insurance.demo.model.StaffSpeciality;
import com.insurance.demo.repository.AppUserRepository;

@Configuration
public class DataInitializer {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	@Bean
	CommandLineRunner initSeedData(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
			AppSecurityProperties securityProperties) {
		return args -> {

			if (!securityProperties.isSeedAdminEnabled()) {
				log.info("Data seeding disabled (app.security.seed-admin.enabled=false).");
				return;
			}

			// 1. Admin User
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

				log.info("Default admin user created successfully (admin@insurance.com / Admin@123).");
			} else {
				log.info("Admin user already exists.");
			}

			// 2. Staff User (For Testing)
			if (userRepository.findByEmail("staff@insurance.com").isEmpty()) {

				AppUser staff = new AppUser();
				staff.setFullName("Testing Staff");
				staff.setEmail("staff@insurance.com");
				staff.setPassword(passwordEncoder.encode("Staff@123"));
				staff.setMobileNumber("9876543211");
				staff.setIsActive(true);
				staff.setEmailVerified(true);
				staff.setPhoneVerified(true);
				staff.setRole(Role.ROLE_INTERNAL_STAFF);
				staff.setTokenVersion(0L);

				StaffSpeciality staffSpeciality = new StaffSpeciality();
				staffSpeciality.setProductSpeciality(ProductType.HEALTH);
				staffSpeciality.setStaff(staff);
				staff.setStaffSpeciality(staffSpeciality);

				userRepository.save(staff);

				log.info("Default test staff user created successfully (staff@insurance.com / Staff@123).");
			} else {
				log.info("Staff user already exists.");
			}

			// 3. Customer User (For Testing)
			if (userRepository.findByEmail("customer@insurance.com").isEmpty()) {

				AppUser customerUser = new AppUser();
				customerUser.setFullName("Testing Customer");
				customerUser.setEmail("customer@insurance.com");
				customerUser.setPassword(passwordEncoder.encode("Customer@123"));
				customerUser.setMobileNumber("9876543212");
				customerUser.setIsActive(true);
				customerUser.setEmailVerified(true);
				customerUser.setPhoneVerified(true);
				customerUser.setRole(Role.ROLE_CUSTOMER);
				customerUser.setTokenVersion(0L);

				Customer customerProfile = new Customer();
				customerProfile.setUser(customerUser);
				customerProfile.setDateOfBirth(LocalDate.of(1995, 1, 1));
				customerProfile.setAddress("123 Test Street");
				customerProfile.setCity("Mumbai");
				customerProfile.setState("Maharashtra");
				customerProfile.setPinCode("400001");
				customerProfile.setNomineeName("Nominee User");
				customerProfile.setNomineeRelation("Spouse");
				customerUser.setCustomer(customerProfile);

				userRepository.save(customerUser);

				log.info("Default test customer user created successfully (customer@insurance.com / Customer@123).");
			} else {
				log.info("Customer user already exists.");
			}
		};
	}
}
