import { useEffect, useRef } from 'react';
import { useAIStore } from './AIStore';
import ReactMarkdown from 'react-markdown';
import { Message } from './AIMessageTypes';

export const AIChatMessages = () => {
    const { activeConversationId, conversations } = useAIStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 获取当前活跃对话的消息
    const messages = activeConversationId
        ? conversations[activeConversationId]?.messages || []
        : [];

    // 自动滚动到最新消息
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message: Message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                >
                    <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                    >
                        {message.role === 'assistant' ? (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                            <p>{message.content}</p>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}; 