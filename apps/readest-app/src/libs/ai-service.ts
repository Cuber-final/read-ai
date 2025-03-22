// AI服务客户端接口 - 直接连接PrivateGPT API

// PrivateGPT服务配置
const PRIVATEGPT_URL = 'http://localhost:8000';

// 检查PrivateGPT服务状态
export async function checkAIServiceStatus(): Promise<boolean> {
    try {
        const response = await fetch(`${PRIVATEGPT_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('检查AI服务状态失败:', error);
        return false;
    }
}

// 流式查询AI服务
export function streamQueryAI(
    text: string,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
) {
    let fullResponse = '';
    let abortController = new AbortController();

    (async () => {
        try {
            // 构建请求体
            const requestBody: {
                prompt: string;
                stream: boolean;
                context_text?: string;
            } = {
                prompt: text,
                stream: true
            };

            // 如果有上下文，添加到请求
            if (context) {
                requestBody.context_text = context;
            }

            const response = await fetch(`${PRIVATEGPT_URL}/api/v1/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('响应没有body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';

            // 读取流
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                buffer += text;

                // 处理SSE格式数据
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.choices && data.choices[0] && data.choices[0].text) {
                                const chunk = data.choices[0].text;
                                fullResponse += chunk;
                                onChunk(chunk);
                            }
                        } catch (err) {
                            console.error('解析SSE消息失败:', err, line);
                        }
                    }
                }
            }

            // 如果没有正常结束，也调用完成回调
            onComplete(fullResponse);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('流式请求失败:', error);
                onError(error);
            } else if (!(error instanceof Error)) {
                console.error('未知错误:', error);
                onError(new Error(String(error)));
            }
        }
    })();

    // 返回停止函数
    return () => {
        abortController.abort();
    };
}

// 兼容性查询函数
export async function queryAI(text: string, context?: string): Promise<{ response: string }> {
    return new Promise((resolve, reject) => {
        let fullResponse = '';
        const stopFn = streamQueryAI(
            text,
            context,
            (chunk) => { fullResponse += chunk; },
            (response) => { resolve({ response: fullResponse }); },
            (error) => { reject(error); }
        );

        // 30秒超时
        const timeout = setTimeout(() => {
            stopFn();
            reject(new Error('查询超时'));
        }, 30000);

        // 成功响应后清除超时
        const origResolve = resolve;
        resolve = (result) => {
            clearTimeout(timeout);
            origResolve(result);
        };
    });
} 