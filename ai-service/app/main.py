from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
import json

app = FastAPI(title="Readest AI Service")

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420"],  # Tauri默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PrivateGPT API配置
PRIVATEGPT_URL = "http://localhost:8001"

class QueryRequest(BaseModel):
    query: str
    context: str = ""

@app.get("/health")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PRIVATEGPT_URL}/health")
            if response.status_code == 200:
                return {"status": "ok"}
            return {"status": "privategpt_unavailable"}
    except Exception:
        return {"status": "privategpt_unavailable"}

@app.post("/api/chat")
async def chat(request: QueryRequest):
    try:
        async def generate_stream():
            # 开始SSE流
            yield "data: {\"type\":\"start\"}\n\n"
            
            # 准备PrivateGPT请求数据
            payload = {
                "prompt": request.query,
                "stream": True,
            }
            
            # 如果有上下文，添加到context_text
            if request.context:
                payload["context_text"] = request.context
                
            # 使用httpx创建异步客户端
            async with httpx.AsyncClient(timeout=60.0) as client:
                # 发送流式请求到PrivateGPT
                async with client.stream(
                    "POST", 
                    f"{PRIVATEGPT_URL}/api/v1/completions", 
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        error_message = await response.aread()
                        yield f"data: {{\"type\":\"error\",\"content\":\"{error_message}\"}}\n\n"
                        return
                        
                    # 处理PrivateGPT的流式响应
                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        if buffer.endswith("\n") and buffer.strip():
                            lines = buffer.strip().split("\n")
                            buffer = ""
                            
                            for line in lines:
                                if line.startswith("data: "):
                                    try:
                                        data = json.loads(line[6:])
                                        if data.get("choices") and data["choices"][0].get("text"):
                                            text = data["choices"][0]["text"]
                                            # 将PrivateGPT的响应转换为我们的格式
                                            yield f"data: {{\"type\":\"chunk\",\"content\":\"{text}\"}}\n\n"
                                    except json.JSONDecodeError:
                                        pass
            
            # 结束标记
            yield "data: {\"type\":\"end\"}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 