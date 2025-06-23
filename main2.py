from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import asyncio
from datetime import datetime
import uvicorn
from typing import AsyncGenerator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FastAPI Proxy Gateway", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
API_VERSION = "v1"
TARGET_SERVICE_URL = "https://ms-2-services-production.up.railway.app"

# Create an HTTP client with streaming support
http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(30.0, connect=10.0),
    follow_redirects=True,
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
)

# Headers that shouldn't be forwarded (hop-by-hop headers)
HOP_BY_HOP_HEADERS = {
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailers', 'transfer-encoding', 'upgrade', 'content-length'
}

def filter_headers(headers: dict, remove_host: bool = True) -> dict:
    """Filter out hop-by-hop headers and optionally host header"""
    filtered = {}
    for name, value in headers.items():
        name_lower = name.lower()
        if name_lower in HOP_BY_HOP_HEADERS:
            continue
        if remove_host and name_lower == 'host':
            continue
        filtered[name] = value
    return filtered

async def stream_response(response: httpx.Response) -> AsyncGenerator[bytes, None]:
    """Stream response data in chunks"""
    try:
        async for chunk in response.aiter_bytes(chunk_size=8192):
            yield chunk
    except Exception as e:
        logger.error(f"Error streaming response: {e}")
        raise

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    logger.info(f"[GATEWAY] {start_time.isoformat()} - {request.method} {request.url}")
    logger.info(f"[GATEWAY] Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"[GATEWAY] Response: {response.status_code} - Time: {process_time:.3f}s")
    
    return response

async def proxy_request(request: Request, target_path: str):
    """
    Proxy request with true streaming support
    """
    logger.info(f"[PROXY] 🚀 Proxying: {request.method} {request.url}")
    
    # Build target URL
    target_url = f"{TARGET_SERVICE_URL}{target_path}"
    if request.url.query:
        target_url += f"?{request.url.query}"
    
    logger.info(f"[PROXY] Target URL: {target_url}")
    
    try:
        # Prepare headers
        headers = filter_headers(dict(request.headers))
        
        # Get request body as async iterator for streaming
        async def request_body_stream():
            async for chunk in request.stream():
                yield chunk
        
        # Create the proxy request with streaming
        proxy_request = http_client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=request_body_stream() if request.method.upper() in ['POST', 'PUT', 'PATCH'] else None
        )
        
        # Send the request and get streaming response
        response = await http_client.send(proxy_request, stream=True)
        
        logger.info(f"[PROXY] ✅ Response: {response.status_code} for {request.url}")
        
        # Filter response headers
        response_headers = filter_headers(dict(response.headers), remove_host=False)
        
        print(StreamingResponse(
            stream_response(response),
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type")
        ))
        
        # Return streaming response
        return StreamingResponse(
            stream_response(response),
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type")
        )
        
    except httpx.TimeoutException as e:
        logger.error(f"[PROXY] ❌ Timeout error for {request.url}: {e}")
        raise HTTPException(status_code=504, detail="Gateway Timeout")
    
    except httpx.ConnectError as e:
        logger.error(f"[PROXY] ❌ Connection error: {e}")
        raise HTTPException(status_code=502, detail="Bad Gateway - Connection Error")
    
    except httpx.RequestError as e:
        logger.error(f"[PROXY] ❌ Request error: {e}")
        raise HTTPException(status_code=502, detail="Bad Gateway - Request Error")
    
    except Exception as e:
        logger.error(f"[PROXY] ❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Direct route for /api/v1/services (without additional path)
@app.api_route(
    f"/api/{API_VERSION}/services", 
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
async def proxy_to_services_root(request: Request):
    """
    Proxy requests to the root services endpoint
    """
    logger.info(f"[PROXY] ROOT route hit")
    return await proxy_request(request, "/services")

# Route for /api/v1/services/* (with additional path)
@app.api_route(
    f"/api/{API_VERSION}/services/{{path:path}}", 
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
async def proxy_to_services_with_path(request: Request, path: str = ""):
    """
    Proxy requests to services with additional path
    """
    logger.info(f"[PROXY] PATH route hit: '{path}'")
    target_path = f"/services/{path}" if path else "/services"
    return await proxy_request(request, target_path)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FastAPI Proxy Gateway is running",
        "version": "1.0.0",
        "proxy_routes": [f"/api/{API_VERSION}/services/*"],
        "target": TARGET_SERVICE_URL,
        "approach": "True Proxy with Streaming"
    }

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()
    logger.info("HTTP client closed")

if __name__ == "__main__":
    print("🚀 Starting FastAPI Proxy Gateway")
    print(f"📍 Proxy route: /api/{API_VERSION}/services/*")
    print(f"🎯 Target service: {TARGET_SERVICE_URL}")
    print("🔗 Test URL: http://localhost:3000/api/v1/services/test")
    print("🌊 Using streaming proxy approach")
    
    uvicorn.run(
        "main2:app",  # Change this to your filename if different
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    )