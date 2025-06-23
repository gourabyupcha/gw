from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
from datetime import datetime
import uvicorn

app = FastAPI(title="API Gateway", version="1.0.0")

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

# Create an HTTP client with timeout
http_client = httpx.AsyncClient(timeout=30.0)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    print(f"[GATEWAY] {start_time.isoformat()} - {request.method} {request.url}")
    print(f"[GATEWAY] Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    print(f"[GATEWAY] Response: {response.status_code} - Time: {process_time:.3f}s")
    
    return response

@app.api_route(
    f"/api/{API_VERSION}/services/{{path:path}}", 
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
async def proxy_to_services(request: Request, path: str = ""):
    """
    Proxy requests to the services microservice
    """
    print(f"[PROXY] 🚀 Proxying: {request.method} {request.url}")
    print(f"[PROXY] Path parameter: '{path}'")
    
    # Build the target URL - if path is empty, don't add trailing slash
    if path:
        target_url = f"{TARGET_SERVICE_URL}/services/{path}"
    else:
        target_url = f"{TARGET_SERVICE_URL}/services"
    
    if request.url.query:
        target_url += f"?{request.url.query}"
    
    print(f"[PROXY] Target URL: {target_url}")
    
    try:
        # Get request body if present
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # Prepare headers (exclude host header)
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)  # Let httpx handle this
        
        # Make the proxy request
        proxy_response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            follow_redirects=True
        )
        
        print(f"[PROXY] ✅ Response: {proxy_response.status_code} for {request.url}")
        
        # Prepare response headers - remove problematic headers
        response_headers = dict(proxy_response.headers)
        headers_to_remove = [
            'content-length',
            'transfer-encoding', 
            'connection',
            'upgrade',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailers'
        ]
        
        for header in headers_to_remove:
            response_headers.pop(header, None)
            response_headers.pop(header.title(), None)  # Remove title case version too
        
        # Return the response
        return Response(
            content=proxy_response.content,
            status_code=proxy_response.status_code,
            headers=response_headers,
            media_type=proxy_response.headers.get("content-type")
        )
        
    except httpx.TimeoutException:
        print(f"[PROXY] ❌ Timeout error for {request.url}")
        raise HTTPException(status_code=504, detail="Gateway Timeout")
    
    except httpx.RequestError as e:
        print(f"[PROXY] ❌ Request error: {str(e)}")
        raise HTTPException(status_code=502, detail="Bad Gateway")
    
    except Exception as e:
        print(f"[PROXY] ❌ Unexpected error: {str(e)}")
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
    print(f"[PROXY] 🚀 Proxying ROOT: {request.method} {request.url}")
    
    # Build the target URL - add /services to the target
    target_url = f"{TARGET_SERVICE_URL}/services"
    if request.url.query:
        target_url += f"?{request.url.query}"
    
    print(f"[PROXY] Target URL: {target_url}")
    
    try:
        # Get request body if present
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # Prepare headers (exclude host header)
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)  # Let httpx handle this
        
        # Make the proxy request
        proxy_response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            follow_redirects=True
        )
        
        print(f"[PROXY] ✅ Response: {proxy_response.status_code} for {request.url}")
        
        # Prepare response headers - remove problematic headers
        response_headers = dict(proxy_response.headers)
        headers_to_remove = [
            'content-length',
            'transfer-encoding', 
            'connection',
            'upgrade',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailers'
        ]
        
        for header in headers_to_remove:
            response_headers.pop(header, None)
            response_headers.pop(header.title(), None)  # Remove title case version too
        
        # Return the response
        return Response(
            content=proxy_response.content,
            status_code=proxy_response.status_code,
            headers=response_headers,
            media_type=proxy_response.headers.get("content-type")
        )
        
    except httpx.TimeoutException:
        print(f"[PROXY] ❌ Timeout error for {request.url}")
        raise HTTPException(status_code=504, detail="Gateway Timeout")
    
    except httpx.RequestError as e:
        print(f"[PROXY] ❌ Request error: {str(e)}")
        raise HTTPException(status_code=502, detail="Bad Gateway")
    
    except Exception as e:
        print(f"[PROXY] ❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

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
        "message": "API Gateway is running",
        "version": "1.0.0",
        "proxy_routes": [f"/api/{API_VERSION}/services/*"],
        "target": TARGET_SERVICE_URL
    }

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()

if __name__ == "__main__":
    print("🚀 Starting API Gateway")
    print(f"📍 Proxy route: /api/{API_VERSION}/services/*")
    print(f"🎯 Target service: {TARGET_SERVICE_URL}")
    print("🔗 Test URL: http://localhost:3000/api/v1/services/test")
    
    uvicorn.run(
        "main:app",  # Change this to your filename if different
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    )