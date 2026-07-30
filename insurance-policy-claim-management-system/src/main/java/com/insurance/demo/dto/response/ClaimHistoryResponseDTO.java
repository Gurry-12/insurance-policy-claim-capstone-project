package com.insurance.demo.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimHistoryResponseDTO {

	private Long historyId;

	private String previousStatus;

	private String newStatus;

	private String remarks;

	private String updatedBy;

	private LocalDateTime updatedDate;
}