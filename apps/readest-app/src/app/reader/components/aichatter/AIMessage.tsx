import clsx from 'clsx';
import React, { useState } from 'react';
import { RiClipboardLine, RiCheckLine } from 'react-icons/ri';
import ReactMarkdown from 'react-markdown';
import { Message as AIMessageType } from './AIMessageTypes';
import { useTranslation } from '@/hooks/useTranslation';

interface AIMessageProps {
    message: AIMessageType;
}

const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
    const _ = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={clsx(
                "mb-4 group",
                message.role === 'user' ? "flex justify-end" : "flex justify-start"
            )}
        >
            <div
                className={clsx(
                    "relative rounded-lg p-3 max-w-[85%]",
                    message.role === 'user'
                        ? "bg-primary text-primary-content"
                        : "bg-base-300 text-base-content"
                )}
            >
                {message.role === 'assistant' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="p-1 hover:bg-base-200 rounded-full"
                            title={copied ? _('已复制') : _('复制')}
                        >
                            {copied ? <RiCheckLine size={16} /> : <RiClipboardLine size={16} />}
                        </button>
                    </div>
                )}

                {message.role === 'assistant' ? (
                    <div className="ai-markdown prose prose-sm max-w-none break-words">
                        <ReactMarkdown>
                            {message.content || ' '}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <p className="break-words">{message.content}</p>
                )}
            </div>
        </div>
    );
};

export default AIMessage;
