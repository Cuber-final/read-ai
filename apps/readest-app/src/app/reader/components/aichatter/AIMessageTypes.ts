export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: number;
}

// 聊天状态接口
export interface AIChatState {
    isVisible: boolean;
    messages: Message[];
    toggleVisibility: () => void;
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

// 单次对话记录接口
export interface AIConversation {
    id: string;
    title: string;
    messages: Message[]; // 使用合并后的 Message 类型
    createdAt: number;
    updatedAt: number;
}

// 可选上下文信息
export interface AIContext {
    text?: string;
    bookSection?: string;
    bookTitle?: string;
}

