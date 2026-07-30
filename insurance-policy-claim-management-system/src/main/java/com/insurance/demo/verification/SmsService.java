package com.insurance.demo.verification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SmsService {

    @Value("${app.twilio.account-sid}")
    private String accountSid;

    @Value("${app.twilio.auth-token}")
    private String authToken;

    @Value("${app.twilio.from-phone}")
    private String fromPhone;


    
    public void sendOtp(String toPhone, String otp) {
        if (!StringUtils.hasText(accountSid) || !StringUtils.hasText(authToken) || !StringUtils.hasText(fromPhone)) {
            log.warn("Twilio is not configured. Phone OTP for {} is {}", toPhone, otp);
            return;
        }

        Twilio.init(accountSid, authToken);
        String messageText = "Your verification OTP is: " + otp + ". Valid for 5 minutes. Do not share it with anyone.";

        Message.creator(
                new PhoneNumber(toPhone),
                new PhoneNumber(fromPhone),
                messageText
        ).create();
    }
}
