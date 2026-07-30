package com.insurance.demo.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDTO {

	private Long customerId;

	private Long userId;

	private String fullName;

	private String email;

	private String mobileNumber;

	private LocalDate dateOfBirth;

	private String address;

	private String city;

	private String state;

	private String pinCode;

	private String nomineeName;

	private String nomineeRelation;

	private LocalDateTime createdDate;
}