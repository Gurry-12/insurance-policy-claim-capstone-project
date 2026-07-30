package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.CoverageOptionRequestDTO;
import com.insurance.demo.dto.request.CoverageRegenerationRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.model.CoverageOption;


public interface CoverageOptionService {

	ApiResponseDTO<CoverageOption> createCoverageOption(Long planId, CoverageOptionRequestDTO dto);

	ApiResponseDTO<CoverageOption> updateCoverageOption(Long planId, Long optionId, CoverageOptionRequestDTO dto);

	ApiResponseDTO<List<CoverageOption>> getCoverageOptions(Long planId);

	ApiResponseDTO<CoverageOption> activateCoverageOption(Long planId, Long optionId);

	ApiResponseDTO<CoverageOption> deactivateCoverageOption(Long planId, Long optionId);

	ApiResponseDTO<Void> deleteCoverageOption(Long planId, Long optionId);

	ApiResponseDTO<List<CoverageOption>> regenerateCoverageOptions(Long planId, CoverageRegenerationRequestDTO dto);
}
