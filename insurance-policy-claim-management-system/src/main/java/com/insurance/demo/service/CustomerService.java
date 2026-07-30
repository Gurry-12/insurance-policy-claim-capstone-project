package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.CustomerRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.CustomerResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;

public interface CustomerService {

	ApiResponseDTO<CustomerResponseDTO> createCustomer(CustomerRequestDTO requestDTO);

	ApiResponseDTO<CustomerResponseDTO> getCustomerById(Long customerId);

	ApiResponseDTO<List<CustomerResponseDTO>> getAllCustomers();

	ApiResponseDTO<CustomerResponseDTO> updateCustomer(Long customerId, CustomerRequestDTO requestDTO);

	ApiResponseDTO<PageResponseDTO<CustomerResponseDTO>> getAllCustomersWithPagination(int pageNumber, int pageSize,
			String sortBy, String sortDirection, String city, String state, String pinCode);

	ApiResponseDTO<CustomerResponseDTO> getCustomerProfile();
}