package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.CreateStaffRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.UserResponseDTO;

public interface UserService {

	
	ApiResponseDTO<List<UserResponseDTO>> viewAllUsers();

	ApiResponseDTO<UserResponseDTO> activateUser(Long userId);

	ApiResponseDTO<UserResponseDTO> deactivateUser(Long userId);

	ApiResponseDTO<UserResponseDTO> createInternalStaffUser(CreateStaffRequestDTO staffRequestDTO);

	ApiResponseDTO<PageResponseDTO<UserResponseDTO>> getAllUsersWithPagination(int pageNumber, int pageSize,
			String sortBy, String sortDirection, String role, Boolean isActive, String fullName, String email);

	UserResponseDTO findByEmail(String username);
	
	ApiResponseDTO<UserResponseDTO> findUserById(Long id);

}
