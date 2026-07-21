package com.santyman.revenant.exception;

import org.springframework.security.core.AuthenticationException;

public class InvalidOrMissingTokenException extends AuthenticationException {

    public InvalidOrMissingTokenException(String message) {
        super(message);
    }
}