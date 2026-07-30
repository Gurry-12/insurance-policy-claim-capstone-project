package com.insurance.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PublicStatsResponseDTO;
import com.insurance.demo.service.PublicService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "0. Public API", description = "Unauthenticated public endpoints for platform statistics and information")
public class PublicController {

    private final PublicService publicService;

    @GetMapping("/stats")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Get Platform Statistics", description = "Returns live platform statistics for the landing page. Falls back to default numbers if DB is empty.")
    public ApiResponseDTO<PublicStatsResponseDTO> getPlatformStats() {
        return publicService.getPlatformStats();
    }
}
