import React, { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill, RiRestartLine } from 'react-icons/ri';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIStore } from './AIStore';
import { streamQueryAI, checkAIServiceStatus } from '@/libs/ai-service';
import { Message } from './AIMessageTypes';

interface AIInputProps {
    onSend: (text: string) => void;
}

const AIInput: React.FC<AIInputProps> = ({ onSend }) => {
    const _ = useTranslation();
    const [inputText, setInputText] = useState('');
    const [serviceReady, setServiceReady] = useState(false);
    const { isLoading, setLoading, conversations, activeConversationId, addUserMessage, updateAssistantMessage } = useAIStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const stopStreamRef = useRef<() => void>(() => { });

    // 自动调整文本框高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [inputText]);

    // 检查服务状态
    useEffect(() => {
        checkAIServiceStatus().then(status => {
            setServiceReady(status);
        });
    }, []);

    // 查询AI
    const queryAI = (text: string) => {
        if (!serviceReady || !text.trim()) return;

        setLoading(true);
        updateAssistantMessage('');

        // 停止之前的流
        if (stopStreamRef.current) {
            stopStreamRef.current();
        }

        // 开始新的流式请求
        stopStreamRef.current = streamQueryAI(
            text,
            undefined,
            // 每收到一个数据块更新UI
            (chunk: string) => {
                if (!activeConversationId) return;
                const conversation = useAIStore.getState().conversations[activeConversationId];
                if (!conversation) return;

                const assistantMessages = conversation.messages.filter((m: Message) => m.role === 'assistant');
                const currentMessage = assistantMessages[assistantMessages.length - 1]?.content || '';
                updateAssistantMessage(currentMessage + chunk);
            },
            // 请求完成
            () => {
                setLoading(false);
            },
            // 错误处理
            (error: Error) => {
                updateAssistantMessage(`查询出错: ${error.message}`);
                setLoading(false);
            }
        );
    };

    // 发送消息
    const handleSend = () => {
        if (!inputText.trim() || isLoading) return;

        const text = inputText;
        setInputText('');
        addUserMessage(text);
        queryAI(text);
        onSend(text);
    };

    // 重新生成回答
    const handleRegenerate = () => {
        if (isLoading || !activeConversationId) return;

        const conversation = conversations[activeConversationId];
        if (!conversation || conversation.messages.length === 0) return;

        // 找到最后一条用户消息
        const userMessages = conversation.messages.filter((m: Message) => m.role === 'user');
        if (userMessages.length === 0) return;

        const lastUserMessage = userMessages[userMessages.length - 1];
        if (!lastUserMessage) return;

        queryAI(lastUserMessage.content);
    };

    // 按下Enter键发送消息
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ai-input border-t border-base-300 p-3">
            {!serviceReady && (
                <div className="text-error text-xs mb-2">
                    {_('AI服务未启动或无法连接。请确保PrivateGPT在localhost:8001上运行。')}
                </div>
            )}

            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={_('输入问题...')}
                    disabled={!serviceReady || isLoading}
                    className="textarea textarea-bordered flex-grow resize-none min-h-10 max-h-32"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={!serviceReady || isLoading || !inputText.trim()}
                    className="btn btn-primary btn-sm"
                    title={_('发送')}
                >
                    <RiSendPlaneFill size={20} />
                </button>

                <button
                    onClick={handleRegenerate}
                    disabled={!serviceReady || isLoading || !activeConversationId}
                    className="btn btn-outline btn-sm"
                    title={_('重新生成')}
                >
                    <RiRestartLine size={20} />
                </button>
            </div>
        </div>
    );
};

export default AIInput;
