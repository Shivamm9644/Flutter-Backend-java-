package com.inurum.dashcam.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;

/**
 * Reverse-proxies media requests (/media/** and /videos/**) on Spring Boot port 8080
 * to the Node.js JT/T 1078 protocol gateway on port 3000.
 * Ensures Flutter mobile apps, web dashboards and media players loading HLS .m3u8 playlists
 * or .ts video segments via port 8080 receive real camera streams seamlessly.
 */
@Controller
public class MediaProxyController {

    private final String gatewayUrl;

    public MediaProxyController(@Value("${gateway.url:http://127.0.0.1:3000}") String gatewayUrl) {
        this.gatewayUrl = gatewayUrl.endsWith("/") ? gatewayUrl.substring(0, gatewayUrl.length() - 1) : gatewayUrl;
    }

    @RequestMapping(value = {"/media/**", "/videos/**", "/api/video/**"},
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.HEAD, RequestMethod.OPTIONS})
    public void proxyMedia(HttpServletRequest request, HttpServletResponse response) {
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String targetUrl = gatewayUrl + path + (query != null ? "?" + query : "");

        HttpURLConnection conn = null;
        try {
            URL url = new URL(targetUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod(request.getMethod());
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            // Forward Authorization and Content-Type headers if present
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null) {
                conn.setRequestProperty("Authorization", authHeader);
            }
            String cType = request.getHeader("Content-Type");
            if (cType != null) {
                conn.setRequestProperty("Content-Type", cType);
            }

            if ("POST".equalsIgnoreCase(request.getMethod()) || "PUT".equalsIgnoreCase(request.getMethod())) {
                conn.setDoOutput(true);
                try (InputStream in = request.getInputStream(); OutputStream out = conn.getOutputStream()) {
                    in.transferTo(out);
                }
            }

            int status = conn.getResponseCode();

            // Handle redirect from gateway (e.g., fallback to /videos/road_cam.mp4)
            if (status == HttpServletResponse.SC_MOVED_TEMPORARILY || status == HttpServletResponse.SC_MOVED_PERMANENTLY) {
                String location = conn.getHeaderField("Location");
                response.setStatus(status);
                response.setHeader("Location", location);
                response.setHeader("Access-Control-Allow-Origin", "*");
                return;
            }

            response.setStatus(status);

            // Copy relevant headers
            String contentType = conn.getContentType();
            if (contentType != null) {
                response.setContentType(contentType);
            } else if (path.endsWith(".m3u8")) {
                response.setContentType("application/vnd.apple.mpegurl");
            } else if (path.endsWith(".ts")) {
                response.setContentType("video/mp2t");
            } else if (path.endsWith(".mp4")) {
                response.setContentType("video/mp4");
            }

            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Cache-Control", conn.getHeaderField("Cache-Control") != null
                    ? conn.getHeaderField("Cache-Control")
                    : (path.endsWith(".m3u8") ? "no-cache, no-store, must-revalidate" : "public, max-age=10"));

            long contentLength = conn.getContentLengthLong();
            if (contentLength > 0) {
                response.setContentLengthLong(contentLength);
            }

            // Stream response payload
            InputStream is = (status >= 400) ? conn.getErrorStream() : conn.getInputStream();
            if (is != null) {
                try (is; OutputStream os = response.getOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = is.read(buffer)) != -1) {
                        os.write(buffer, 0, bytesRead);
                    }
                    os.flush();
                }
            }
        } catch (Exception e) {
            try {
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.getWriter().write("{\"error\":\"MEDIA_STREAM_OFFLINE\",\"message\":\"" + e.getMessage() + "\"}");
                }
            } catch (Exception ignored) {}
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
