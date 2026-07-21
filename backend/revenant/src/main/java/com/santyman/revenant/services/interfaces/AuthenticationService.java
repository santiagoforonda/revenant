package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.LoginRequest;
import com.santyman.revenant.dtos.LoginResponse;
import com.santyman.revenant.dtos.RegisterRequest;
import com.santyman.revenant.dtos.RegisterResponse;

public interface AuthenticationService {

    RegisterResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);
}
