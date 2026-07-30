package com.insurance.demo.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationErrorResponseDTO {

    private LocalDateTime timestamp;
    private int statusCode;
    private String errorType;
    private String message;
    private String requestPath;
    private Map<String, String> fieldErrors;
}
