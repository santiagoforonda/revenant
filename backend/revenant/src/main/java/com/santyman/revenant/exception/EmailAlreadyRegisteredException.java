package com.santyman.revenant.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("Email address already registered: " + email);
    }
}
