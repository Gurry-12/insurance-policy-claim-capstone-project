package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.ProductRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.ProductResponseDTO;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.service.InsuranceProductService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "4. Insurance Product API", description = "Endpoints for managing core insurance products")
public class InsuranceProductController {

	private final InsuranceProductService productService;

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create Insurance Product", description = "Creates a new insurance product category (e.g., Health, Auto). Restricted to Admin.")
	public ApiResponseDTO<ProductResponseDTO> createProduct(@Valid @RequestBody ProductRequestDTO dto) {
		return productService.createProduct(dto);
	}

	@PatchMapping("/{id}/deactivate")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Deactivate Product", description = "Marks an insurance product as inactive.")
	public ApiResponseDTO<ProductResponseDTO> deactivateProduct(@PathVariable Long id) {
		return productService.deactivateProduct(id);
	}

	@GetMapping("/active")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "View Active Products", description = "Retrieves a list of all currently active insurance products available for customers.")
	public ApiResponseDTO<List<ProductResponseDTO>> viewActiveProducts() throws ResourceNotFoundException {
		return productService.viewActiveProducts();
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Update Insurance Product", description = "Updates the details of an existing insurance product.")
	public ApiResponseDTO<ProductResponseDTO> updateProduct(@PathVariable Long id,
			@Valid @RequestBody ProductRequestDTO requestDTO) {
		return productService.updateProduct(id, requestDTO);
	}
	
	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get Product by ID", description = "Retrieves the details of a specific insurance product by its ID.")
	public ApiResponseDTO<ProductResponseDTO> getProductById(@PathVariable Long id) {
		return productService.getProductById(id);
	}
	
	@GetMapping("/page")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Products (Paginated)", description = "Retrieves a paginated list of all products with filtering options for type and status.")
	public ApiResponseDTO<PageResponseDTO<ProductResponseDTO>> getAllProductsWithPagination(
			@RequestParam(defaultValue = "0") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String productType,
			@RequestParam(required = false) Boolean isActive,
			@RequestParam(required = false) String productName) {
		return productService.getAllProductsWithPagination(pageNumber, pageSize, sortBy, sortDirection, productType, isActive, productName);
	}
	
	@PatchMapping("/{id}/activate")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Activate Product", description = "Reactivates a previously deactivated insurance product.")
	public ApiResponseDTO<ProductResponseDTO> activateProduct(@PathVariable Long id) {
		return productService.activateProduct(id);
	}
}
