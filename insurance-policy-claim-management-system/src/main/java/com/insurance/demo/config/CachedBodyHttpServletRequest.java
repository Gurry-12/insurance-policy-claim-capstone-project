package com.insurance.demo.config;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

/**
 * Buffers the request body so a filter can inspect it (e.g. to extract the
 * email for rate-limit keying) while still allowing the downstream handler to
 * read the original body.
 */
public class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {

	private final byte[] cachedBody;

	public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
		super(request);
		this.cachedBody = request.getInputStream().readAllBytes();
	}

	@Override
	public ServletInputStream getInputStream() throws IOException {
		ByteArrayInputStream buffer = new ByteArrayInputStream(cachedBody);
		return new ServletInputStream() {
			@Override
			public boolean isFinished() {
				return buffer.available() == 0;
			}

			@Override
			public boolean isReady() {
				return true;
			}

			@Override
			public void setReadListener(ReadListener readListener) {
				throw new UnsupportedOperationException();
			}

			@Override
			public int read() {
				return buffer.read();
			}
		};
	}

	@Override
	public BufferedReader getReader() throws IOException {
		return new BufferedReader(new InputStreamReader(getInputStream()));
	}
}
