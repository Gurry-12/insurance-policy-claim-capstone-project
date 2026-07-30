package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.CustomerRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.CustomerResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.service.CustomerService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "3. Customer Profile API", description = "Endpoints for managing customer profiles and personal details")
public class CustomerController {

	private final CustomerService customerService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Create Customer Profile", description = "Creates a customer profile for the logged-in customer.")
	public ApiResponseDTO<CustomerResponseDTO> createCustomer(@Valid @RequestBody CustomerRequestDTO requestDTO) {

		return customerService.createCustomer(requestDTO);
	}

	@GetMapping("/{customerId}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get Customer by ID", description = "Retrieves a specific customer profile by ID.")
	public ApiResponseDTO<CustomerResponseDTO> getCustomerById(@PathVariable Long customerId) {

		return customerService.getCustomerById(customerId);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Customers", description = "Retrieves a list of all customer profiles. Restricted to Admin/Internal Staff.")
	public ApiResponseDTO<List<CustomerResponseDTO>> getAllCustomers() {

		return customerService.getAllCustomers();
	}

	@PutMapping("/{customerId}")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Update Customer Profile", description = "Updates an existing customer's profile information.")
	public ApiResponseDTO<CustomerResponseDTO> updateCustomer(@PathVariable Long customerId,
			@Valid @RequestBody CustomerRequestDTO requestDTO) {

		return customerService.updateCustomer(customerId, requestDTO);
	}

	@GetMapping("/page")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Customers", description = "Retrieves a paginated list of all customer profiles. Restricted to Admin/Internal Staff.")
	public ApiResponseDTO<PageResponseDTO<CustomerResponseDTO>> getAllCustomersWithPagination(
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy, @RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String city, @RequestParam(required = false) String state,
			@RequestParam(required = false) String pinCode) {

		return customerService.getAllCustomersWithPagination(pageNumber, pageSize, sortBy, sortDirection, city, state, pinCode);
	}

	@GetMapping("/profile")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Get My Profile", description = "Retrieves the customer profile of the currently logged-in user.")
	public ApiResponseDTO<CustomerResponseDTO> getCustomerProfile() {

		return customerService.getCustomerProfile();
	}
}