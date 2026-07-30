package com.insurance.demo.service;

import java.time.LocalDate;

import com.insurance.demo.dto.request.PolicyIssueRequestDTO;
import com.insurance.demo.dto.request.PolicyPurchaseRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PolicyResponseDTO;

public interface PolicyService {

	ApiResponseDTO<PolicyResponseDTO> purchasePolicy(PolicyPurchaseRequestDTO requestDTO);

	ApiResponseDTO<PolicyResponseDTO> issuePolicy(PolicyIssueRequestDTO requestDTO);

	ApiResponseDTO<PolicyResponseDTO> getPolicyById(Long policyId);

	ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getAllPolicies(int pageNumber, int pageSize, String sortBy,
			String sortDirection, Long customerId, String status, String policyNumber);

	ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getCustomerPolicies(String email, int pageNumber, int pageSize,
			String sortBy, String sortDirection);

	ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getPoliciesByCustomer(Long customerId, int pageNumber,
			int pageSize, String sortBy, String sortDirection);


	ApiResponseDTO<PolicyResponseDTO> cancelPolicy(Long policyId);
}