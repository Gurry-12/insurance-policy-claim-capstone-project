package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.CoverageOptionRequestDTO;
import com.insurance.demo.dto.request.CoverageRegenerationRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.model.CoverageOption;
import com.insurance.demo.service.CoverageOptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/policy-plans/{planId}/coverage-options")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CoverageOptionController {

	private final CoverageOptionService coverageOptionService;

	@PostMapping
	public ResponseEntity<ApiResponseDTO<CoverageOption>> createCoverageOption(
			@PathVariable Long planId,
			@Valid @RequestBody CoverageOptionRequestDTO dto) {
		ApiResponseDTO<CoverageOption> response = coverageOptionService.createCoverageOption(planId, dto);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@PutMapping("/{optionId}")
	public ResponseEntity<ApiResponseDTO<CoverageOption>> updateCoverageOption(
			@PathVariable Long planId,
			@PathVariable Long optionId,
			@Valid @RequestBody CoverageOptionRequestDTO dto) {
		ApiResponseDTO<CoverageOption> response = coverageOptionService.updateCoverageOption(planId, optionId, dto);
		return ResponseEntity.ok(response);
	}

	@GetMapping
	public ResponseEntity<ApiResponseDTO<List<CoverageOption>>> getCoverageOptions(@PathVariable Long planId) {
		ApiResponseDTO<List<CoverageOption>> response = coverageOptionService.getCoverageOptions(planId);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{optionId}/activate")
	public ResponseEntity<ApiResponseDTO<CoverageOption>> activateCoverageOption(
			@PathVariable Long planId,
			@PathVariable Long optionId) {
		ApiResponseDTO<CoverageOption> response = coverageOptionService.activateCoverageOption(planId, optionId);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{optionId}/deactivate")
	public ResponseEntity<ApiResponseDTO<CoverageOption>> deactivateCoverageOption(
			@PathVariable Long planId,
			@PathVariable Long optionId) {
		ApiResponseDTO<CoverageOption> response = coverageOptionService.deactivateCoverageOption(planId, optionId);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/{optionId}")
	public ResponseEntity<ApiResponseDTO<Void>> deleteCoverageOption(
			@PathVariable Long planId,
			@PathVariable Long optionId) {
		ApiResponseDTO<Void> response = coverageOptionService.deleteCoverageOption(planId, optionId);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/regenerate")
	public ResponseEntity<ApiResponseDTO<List<CoverageOption>>> regenerateCoverageOptions(
			@PathVariable Long planId,
			@Valid @RequestBody CoverageRegenerationRequestDTO dto) {
		ApiResponseDTO<List<CoverageOption>> response = coverageOptionService.regenerateCoverageOptions(planId, dto);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}
}
