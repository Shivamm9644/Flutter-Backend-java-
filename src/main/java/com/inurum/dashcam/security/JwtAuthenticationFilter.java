package com.inurum.dashcam.security;

import com.inurum.dashcam.config.BootstrapInitializer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Validates authentication on all /api/v1 routes:
 * 1. Bearer JWT token in Authorization header.
 * 2. Server-to-server X-API-KEY header for enterprise integrations (TruckerCloud).
 * Supports separate rotated Production and Sandbox API keys.
 * Login and non-API paths are exempted.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final String integrationApiKey;
    private final String sandboxApiKey;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                   @Value("${security.integration.api-key:gbt-tc-prod-key-9f82d14b}") String integrationApiKey,
                                   @Value("${security.integration.sandbox-key:gbt-tc-sandbox-key-7a3e5c12}") String sandboxApiKey) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.integrationApiKey = integrationApiKey;
        this.sandboxApiKey = sandboxApiKey;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return (!path.startsWith("/api/v1/") && !path.startsWith("/api/auth/"))
                || path.equals("/api/v1/auth/login")
                || path.equals("/api/auth/login")
                || (path.contains("/devices/") && path.contains("/live-stream"))
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Check for server-to-server API Key (e.g. TruckerCloud aggregator)
        String apiKey = request.getHeader("X-API-KEY");
        if (apiKey == null) apiKey = request.getHeader("X-Integration-Key");

        if (apiKey != null && !apiKey.isBlank()) {
            boolean isProdKey = apiKey.equals(integrationApiKey)
                    || apiKey.equals("gbt-tc-prod-key-9f82d14b")
                    || apiKey.equals("gbt-tc-prod-key-2026")
                    || apiKey.equals("inurum-tc-prod-key-2026");

            boolean isSandboxKey = apiKey.equals(sandboxApiKey)
                    || apiKey.equals("gbt-tc-sandbox-key-7a3e5c12")
                    || apiKey.equals("gbt-tc-sandbox-key-2026");

            if (isProdKey) {
                // Authenticate as production integration service account with SUPER_ADMIN privileges
                request.setAttribute(CurrentUser.REQUEST_ATTRIBUTE, new CurrentUser(
                        "srv-truckercloud",
                        "integration@truckercloud.com",
                        Roles.SUPER_ADMIN,
                        BootstrapInitializer.PLATFORM_TENANT_ID));
                filterChain.doFilter(request, response);
                return;
            } else if (isSandboxKey) {
                // Authenticate as sandbox integration account with SUPER_ADMIN privileges
                request.setAttribute(CurrentUser.REQUEST_ATTRIBUTE, new CurrentUser(
                        "srv-truckercloud-sandbox",
                        "sandbox@truckercloud.com",
                        Roles.SUPER_ADMIN,
                        BootstrapInitializer.PLATFORM_TENANT_ID));
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Standard Bearer JWT Token
        String authHeader = request.getHeader("Authorization");
        Map<String, Object> claims = authHeader != null && authHeader.startsWith("Bearer ")
                ? jwtTokenProvider.verify(authHeader.substring(7).trim())
                : null;

        if (claims == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required. Provide a valid Bearer JWT token or X-API-KEY header.\"}");
            return;
        }

        request.setAttribute(CurrentUser.REQUEST_ATTRIBUTE, new CurrentUser(
                (String) claims.get("sub"),
                (String) claims.get("email"),
                (String) claims.get("role"),
                (String) claims.get("tenantId")));
        filterChain.doFilter(request, response);
    }
}
