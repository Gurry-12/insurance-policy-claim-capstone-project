package com.insurance.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimDocumentResponseDTO {
	
	    private String documentName;

	    private String documentType;

	    private String documentReference;  

}
