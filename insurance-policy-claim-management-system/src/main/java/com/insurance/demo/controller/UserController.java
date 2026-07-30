package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.CreateStaffRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.UserResponseDTO;
import com.insurance.demo.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "2. User Management API", description = "Endpoints for managing users and staff (Admin only)")
public class UserController {

	private final UserService userService;

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Get All Users", description = "Retrieves a list of all users.")
	public ApiResponseDTO<List<UserResponseDTO>> viewAllUsers() {
		return userService.viewAllUsers();
	}

	@PatchMapping("/{id}/activate")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Activate User Account", description = "Manually activates a user account. Restricted to Admin.")
	public ApiResponseDTO<UserResponseDTO> activateUser(@PathVariable Long id) {
		return userService.activateUser(id);
	}

	@PatchMapping("/{id}/deactivate")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Deactivate User Account", description = "Deactivates a user account, preventing future logins. Restricted to Admin.")
	public ApiResponseDTO<UserResponseDTO> deactivateUser(@PathVariable Long id) {
		return userService.deactivateUser(id);
	}

	@PostMapping("/staff")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a New Insurance Operations Officer", description = "Registers a new staff account and sends an activation OTP. Restricted to Admin.")
	public ApiResponseDTO<UserResponseDTO> createInternalStaffUser(@Valid @RequestBody CreateStaffRequestDTO staffRequestDTO) {
		return userService.createInternalStaffUser(staffRequestDTO);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Get User by ID", description = "Retrieves details of a specific user by their ID.")
	public ApiResponseDTO<UserResponseDTO> findUserById(@PathVariable Long id) {
		return userService.findUserById(id);
	}

	@GetMapping("/page")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Get All Users", description = "Retrieves a paginated list of all users. Supports filtering by role and active status.")
	public ApiResponseDTO<PageResponseDTO<UserResponseDTO>> getAllUsersWithPagination(@RequestParam(defaultValue = "0") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize, @RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection, @RequestParam(required = false) String role,
			@RequestParam(required = false) Boolean isActive, @RequestParam(required = false) String fullName,
			@RequestParam(required = false) String email) {
		return userService.getAllUsersWithPagination(pageNumber, pageSize, sortBy, sortDirection, role, isActive, fullName, email);
	}
}
