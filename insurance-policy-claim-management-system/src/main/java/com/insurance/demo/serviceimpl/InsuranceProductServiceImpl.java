package com.insurance.demo.serviceimpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.ProductRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.ProductResponseDTO;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ProductNotFoundException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.InsuranceProduct;
import com.insurance.demo.repository.InsuranceProductRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.service.InsuranceProductService;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsuranceProductServiceImpl implements InsuranceProductService {

	private final ModelMapper modelMapper;
	private final InsuranceProductRepository productRepository;
	private final PolicyPlanRepository policyPlanRepository;

	@Override
	@Transactional
	public ApiResponseDTO<ProductResponseDTO> createProduct(ProductRequestDTO dto) {

		if (productRepository.existsByProductNameIgnoreCase(dto.getProductName())) {
			throw new DuplicateResourceException(MessageConstants.Product.ALREADY_EXISTS + dto.getProductName());
		}

		InsuranceProduct product = new InsuranceProduct();

		product.setProductName(dto.getProductName().toLowerCase());
		product.setProductType(dto.getProductType());
		product.setDescription(dto.getDescription());
		product.setIsActive(dto.getActiveStatus() != null ? dto.getActiveStatus() : true);

		InsuranceProduct savedProduct = productRepository.save(product);

		ProductResponseDTO response = modelMapper.map(savedProduct, ProductResponseDTO.class);

		return new ApiResponseDTO<>(MessageConstants.Product.CREATED_SUCCESS, true, response, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ProductResponseDTO> deactivateProduct(Long id) {

		InsuranceProduct product = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + id));

		if (!product.getIsActive()) {
			throw new BadRequestException(MessageConstants.Product.ALREADY_INACTIVE);
		}

		product.setIsActive(false);

		InsuranceProduct updatedProduct = productRepository.save(product);

		ProductResponseDTO response = modelMapper.map(updatedProduct, ProductResponseDTO.class);

		return new ApiResponseDTO<>(MessageConstants.Product.DEACTIVATED_SUCCESS, true, response, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PageResponseDTO<ProductResponseDTO>> getAllProductsWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, String productType, Boolean isActive, String productName) {

		log.info("Fetching products with pagination. pageNumber: {}, pageSize: {}, sortBy: {}, sortDirection: {}, type: {}, active: {}, productName: {}",
				pageNumber, pageSize, sortBy, sortDirection, productType, isActive, productName);
		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "productName", "productType"));

		com.insurance.demo.enums.ProductType typeEnum = null;
		if (productType != null && !productType.trim().isEmpty()) {
			try {
				typeEnum = com.insurance.demo.enums.ProductType.valueOf(productType.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new BadRequestException(MessageConstants.Product.INVALID_FILTER_TYPE + productType);
			}
		}

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(getSortDirection(sortDirection), sortBy));
		
		Specification<InsuranceProduct> spec = (root, query, cb) -> cb.conjunction();
		
		if (typeEnum != null) {
			com.insurance.demo.enums.ProductType finalTypeEnum = typeEnum;
			spec = spec.and((root, query, cb) -> cb.equal(root.get("productType"), finalTypeEnum));
		}
		if (isActive != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
		}
		if (productName != null && !productName.trim().isEmpty()) {
			spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("productName")), "%" + productName.trim().toLowerCase() + "%"));
		}

		Page<InsuranceProduct> productPage = productRepository.findAll(spec, pageable);

		List<ProductResponseDTO> content = productPage.getContent().stream()
				.map(product -> modelMapper.map(product, ProductResponseDTO.class)).toList();
		PageResponseDTO<ProductResponseDTO> pageResponse = new PageResponseDTO<>(content, productPage.getNumber(), productPage.getSize(),
				productPage.getTotalElements(), productPage.getTotalPages(), productPage.isLast(), sortDirection);
		
		return new ApiResponseDTO<>(MessageConstants.Product.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	private Direction getSortDirection(String sortDirection) {
		if (sortDirection == null || sortDirection.equalsIgnoreCase("asc"))
			return Sort.Direction.ASC;
		if (sortDirection.equalsIgnoreCase("desc"))
			return Sort.Direction.DESC;
		throw new BadRequestException(MessageConstants.Common.SORT_DIRECTION_INVALID);
	}

	@Transactional(readOnly = true)
	public ApiResponseDTO<List<ProductResponseDTO>> viewActiveProducts() throws ResourceNotFoundException {

		log.info("fatching all active products");
		List<InsuranceProduct> products = productRepository.findByIsActiveTrue();

		if (products.isEmpty()) {
			log.warn("No active products found");
			throw new ResourceNotFoundException(MessageConstants.Product.ACTIVE_NOT_FOUND);
		}

		List<ProductResponseDTO> productResponseDTOs = products.stream()
				.filter(product -> policyPlanRepository.findByInsuranceProductIdAndIsActiveTrue(product.getId()).size() > 0)
				.map(product -> {

			ProductResponseDTO dto = modelMapper.map(product, ProductResponseDTO.class);

			dto.setActive(product.getIsActive());

			return dto;
		}).toList();

		ApiResponseDTO<List<ProductResponseDTO>> apiResponseDTO = new ApiResponseDTO<>();

		apiResponseDTO.setData(productResponseDTOs);
		apiResponseDTO.setMessage(MessageConstants.Product.ACTIVE_FETCHED);
		apiResponseDTO.setSuccess(true);
		apiResponseDTO.setTimeStamp(LocalDateTime.now());

		log.info("Retrieved {} active products", productResponseDTOs.size());
		return apiResponseDTO;

	}

	@Override
	@Transactional
	public ApiResponseDTO<ProductResponseDTO> updateProduct(Long productId, ProductRequestDTO requestDTO) {

		log.info("Updating product with ID: {}", productId);

		InsuranceProduct existingProduct = productRepository.findById(productId).orElseThrow(() -> {
			log.error("Product not found with ID: {}", productId);
			return new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + productId);
		});

		// checking the duplicate product name
		Optional<InsuranceProduct> productWithSameName = productRepository
				.findByProductNameIgnoreCase(requestDTO.getProductName());

		if (productWithSameName.isPresent() && !productWithSameName.get().getId().equals(productId)) {

			log.warn("Duplicate product name '{}' found", requestDTO.getProductName());

			throw new DuplicateResourceException(MessageConstants.Product.ALREADY_EXISTS + requestDTO.getProductName());
		}

		existingProduct.setProductName(requestDTO.getProductName().trim().toLowerCase());
		existingProduct.setProductType(requestDTO.getProductType());
		existingProduct.setDescription(requestDTO.getDescription().trim());
		if (requestDTO.getActiveStatus() != null) {
			existingProduct.setIsActive(requestDTO.getActiveStatus());
		}

		InsuranceProduct updatedProduct = productRepository.save(existingProduct);

		log.info("Product updated successfully. Product ID: {}", productId);

		ProductResponseDTO responseDTO = modelMapper.map(updatedProduct, ProductResponseDTO.class);
		return new ApiResponseDTO<>(MessageConstants.Product.UPDATED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ProductResponseDTO> activateProduct(Long id) {

		log.info("Activating product with id: {}", id);

		InsuranceProduct product = productRepository.findById(id)
				.orElseThrow(() -> new ProductNotFoundException(MessageConstants.Product.NOT_FOUND + id));

		if (Boolean.TRUE.equals(product.getIsActive())) {
			throw new BadRequestException(MessageConstants.Product.ALREADY_ACTIVE);
		}

		product.setIsActive(true);

		InsuranceProduct updatedProduct = productRepository.save(product);

		ProductResponseDTO dto = modelMapper.map(updatedProduct, ProductResponseDTO.class);

		log.info("Product activated successfully with id: {}", id);

		return new ApiResponseDTO<>(MessageConstants.Product.ACTIVATED_SUCCESS, true, dto, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<ProductResponseDTO> getProductById(Long id) {
		log.info("Fetching product with id: {}", id);
		InsuranceProduct product = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + id));
		org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		boolean isCustomer = auth != null
				&& auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
		if (isCustomer && !Boolean.TRUE.equals(product.getIsActive())) {
			throw new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + id);
		}
		ProductResponseDTO dto = modelMapper.map(product, ProductResponseDTO.class);
		return new ApiResponseDTO<>(MessageConstants.Product.DETAILS_RETRIEVED, true, dto, LocalDateTime.now());
	}

}
