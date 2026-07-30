package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.ProductRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.ProductResponseDTO;

public interface InsuranceProductService {

	ApiResponseDTO<ProductResponseDTO> createProduct(ProductRequestDTO productDto);

	ApiResponseDTO<ProductResponseDTO> deactivateProduct(Long id);

	ApiResponseDTO<PageResponseDTO<ProductResponseDTO>> getAllProductsWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, String productType, Boolean isActive, String productName);

	ApiResponseDTO<ProductResponseDTO> updateProduct(Long id, ProductRequestDTO requestDTO);

	ApiResponseDTO<List<ProductResponseDTO>> viewActiveProducts();

	ApiResponseDTO<ProductResponseDTO> activateProduct(Long id);

	ApiResponseDTO<ProductResponseDTO> getProductById(Long id);

}
