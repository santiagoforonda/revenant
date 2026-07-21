package com.santyman.revenant.util;

import com.santyman.revenant.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtUtil jwtUtil;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secretKey", "TestSecretKeyForJwtUnitTestingPurpose!");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600000L);

        userDetails = new User("heroPlayer", "password", List.of());
    }

    @Test
    @DisplayName("generateToken - produces a non-blank token")
    void generateToken_producesNonBlankToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("getUsernameFromToken - returns the correct subject")
    void getUsernameFromToken_returnsCorrectSubject() {
        String token = jwtUtil.generateToken(userDetails);
        assertThat(jwtUtil.getUsernameFromToken(token)).isEqualTo("heroPlayer");
    }

    @Test
    @DisplayName("validateToken - returns true for matching user and unexpired token")
    void validateToken_validToken_returnsTrue() {
        String token = jwtUtil.generateToken(userDetails);
        assertThat(jwtUtil.validateToken(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("validateToken - returns false when username does not match")
    void validateToken_wrongUser_returnsFalse() {
        String token = jwtUtil.generateToken(userDetails);
        UserDetails otherUser = new User("otherPlayer", "password", List.of());
        assertThat(jwtUtil.validateToken(token, otherUser)).isFalse();
    }

    @Test
    @DisplayName("validateToken - expired token returns false")
    void validateToken_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1000L);
        String expiredToken = jwtUtil.generateToken(userDetails);
        assertThat(jwtUtil.validateToken(expiredToken, userDetails)).isFalse();
    }
}
