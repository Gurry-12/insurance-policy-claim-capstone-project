package com.insurance.demo.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
	
	 Map<String, Object> uploadFile(MultipartFile file)
	            throws IOException;

	    void deleteFile(String publicId)
	            throws IOException;


}
