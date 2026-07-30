package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimDocumentRequestDTO {

    @NotBlank(message = MessageConstants.Validation.DOCUMENT_NAME_REQUIRED)
    private String documentName;

    @NotBlank(message = MessageConstants.Validation.DOCUMENT_TYPE_REQUIRED)
    private String documentType;

    private String documentReference;   // File name, URL or reference
}