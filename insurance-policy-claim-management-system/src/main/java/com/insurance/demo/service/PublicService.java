package com.insurance.demo.service;

import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PublicStatsResponseDTO;

public interface PublicService {

    ApiResponseDTO<PublicStatsResponseDTO> getPlatformStats();
}
