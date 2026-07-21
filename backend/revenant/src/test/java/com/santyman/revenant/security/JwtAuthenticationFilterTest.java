package com.santyman.revenant.security;

import com.santyman.revenant.exception.InvalidOrMissingTokenException;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.servlet.HandlerExceptionResolver;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsServiceImpl userDetailsServiceImpl;

    @Mock
    private HandlerExceptionResolver handlerExceptionResolver;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("doFilter - missing token delegates to exception resolver")
    void doFilter_missingToken_delegatesToExceptionResolver() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        ArgumentCaptor<Exception> exceptionCaptor = ArgumentCaptor.forClass(Exception.class);
        verify(handlerExceptionResolver).resolveException(eq(request), eq(response), isNull(), exceptionCaptor.capture());
        assertThat(exceptionCaptor.getValue())
                .isInstanceOf(InvalidOrMissingTokenException.class)
                .hasMessage("Token is missing");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("doFilter - invalid token delegates to exception resolver")
    void doFilter_invalidToken_delegatesToExceptionResolver() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.getUsernameFromToken("invalid-token")).thenThrow(new io.jsonwebtoken.JwtException("bad token"));

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        ArgumentCaptor<Exception> exceptionCaptor = ArgumentCaptor.forClass(Exception.class);
        verify(handlerExceptionResolver).resolveException(eq(request), eq(response), isNull(), exceptionCaptor.capture());
        assertThat(exceptionCaptor.getValue())
                .isInstanceOf(InvalidOrMissingTokenException.class)
                .hasMessage("Token is invalid or expired");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("doFilter - valid token authenticates request")
    void doFilter_validToken_authenticatesRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("testUser")
                .password("password")
                .authorities(java.util.List.of())
                .build();

        when(jwtUtil.getUsernameFromToken("valid-token")).thenReturn("testUser");
        when(userDetailsServiceImpl.loadUserByUsername("testUser")).thenReturn(userDetails);
        when(jwtUtil.validateToken("valid-token", userDetails)).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(handlerExceptionResolver, never()).resolveException(any(), any(), any(), any());
        verify(filterChain).doFilter(eq(request), eq(response));
    }
}
