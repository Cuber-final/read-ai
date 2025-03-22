import { create } from 'zustand';
import { AIConversation, Message } from './AIMessageTypes';
import { uniqueId } from '@/utils/misc';

/**
 * AIState 接口定义了AI聊天功能的状态和操作
 * 包含侧边栏可见性、当前活跃对话、所有对话列表和加载状态等
 */
interface AIState {
    isAISidebarVisible: boolean;        // AI侧边栏是否可见
    aiSidebarWidth: string;
    isAISidebarPinned: boolean;
    activeConversationId: string | null; // 当前活跃对话的ID
    conversations: Record<string, AIConversation>;
    isLoading: boolean;                  // 是否正在加载

    // 状态操作方法
    setAISidebarVisible: (visible: boolean) => void;  // 设置侧边栏可见性
    setAISidebarWidth: (width: string) => void;
    toggleAISidebarPin: () => void;
    toggleAISidebar: () => void;                      // 切换侧边栏显示状态
    createNewConversation: () => string;              // 创建新对话并返回ID
    setActiveConversation: (id: string) => void;      // 设置当前活跃对话
    addUserMessage: (content: string) => void;        // 添加用户消息
    addAssistantMessage: (content: string) => void;   // 添加AI助手消息
    updateAssistantMessage: (content: string) => void; // 更新最后一条AI消息
    deleteConversation: (id: string) => void;         // 删除指定对话
    clearConversations: () => void;                   // 清空所有对话
    setLoading: (isLoading: boolean) => void;         // 设置加载状态
}

/**
 * 生成消息对象的辅助函数
 * @param content 消息内容
 * @param role 角色(用户或助手)
 * @returns 格式化的消息对象
 */
const generateMessage = (content: string, role: 'user' | 'assistant'): Message => ({
    id: uniqueId(),
    role,
    content,
    timestamp: Date.now()
});

/**
 * 根据内容生成对话标题的辅助函数
 * 如果内容超过20个字符，则截取前20个字符并添加省略号
 */
const generateTitle = (content: string): string =>
    content.length > 20 ? `${content.substring(0, 20)}...` : content;

/**
 * 使用Zustand创建AI状态管理store
 */
export const useAIStore = create<AIState>((set, get) => ({
    // 初始状态
    isAISidebarVisible: false,
    aiSidebarWidth: '350px',
    isAISidebarPinned: false,
    activeConversationId: null,
    conversations: {},
    isLoading: false,

    // 设置侧边栏可见性
    setAISidebarVisible: (visible) => set({ isAISidebarVisible: visible }),

    setAISidebarWidth: (width: string) => set({ aiSidebarWidth: width }),

    // 切换侧边栏显示/隐藏状态
    toggleAISidebar: () => set(state => ({ isAISidebarVisible: !state.isAISidebarVisible })),

    toggleAISidebarPin: () => set((state) => ({ isAISidebarPinned: !state.isAISidebarPinned })),

    // 创建新对话
    createNewConversation: () => {
        const id = uniqueId();
        const newConversation: AIConversation = {
            id,
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        set(state => ({
            conversations: {
                ...state.conversations,
                [id]: newConversation
            },
            activeConversationId: id
        }));
        return id;
    },

    // 设置当前活跃对话
    setActiveConversation: (id) => set({ activeConversationId: id }),

    // 添加用户消息
    addUserMessage: (content) => {
        const { activeConversationId, conversations } = get();
        const message = generateMessage(content, 'user');

        if (!activeConversationId) {
            const newId = get().createNewConversation();
            get().addUserMessage(content);
            return;
        }

        set(state => {
            const conversation = state.conversations[activeConversationId];
            if (!conversation) return state;

            const updatedConversation = {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: Date.now(),
                title: conversation.messages.length === 0 ? generateTitle(content) : conversation.title
            };

            return {
                conversations: {
                    ...state.conversations,
                    [activeConversationId]: updatedConversation
                }
            };
        });
    },

    // 添加AI助手消息
    addAssistantMessage: (content) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const message = generateMessage(content, 'assistant');
        set(state => {
            const conversation = state.conversations[activeConversationId];
            if (!conversation) return state;

            const updatedConversation = {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: Date.now()
            };

            return {
                conversations: {
                    ...state.conversations,
                    [activeConversationId]: updatedConversation
                }
            };
        });
    },

    // 更新最后一条AI助手消息（用于流式响应）
    updateAssistantMessage: (content) => {
        const { activeConversationId, conversations } = get();
        if (!activeConversationId) return;

        const conversation = conversations[activeConversationId];
        if (!conversation) return;

        const messages = conversation.messages;
        const lastMsg = messages[messages.length - 1];

        if (!lastMsg || lastMsg.role !== 'assistant') {
            get().addAssistantMessage(content);
            return;
        }

        set(state => {
            const conversation = state.conversations[activeConversationId];
            if (!conversation) return state;

            const updatedConversation = {
                ...conversation,
                messages: conversation.messages.map((msg, idx) =>
                    idx === conversation.messages.length - 1 ? { ...msg, content } : msg
                ),
                updatedAt: Date.now()
            };

            return {
                conversations: {
                    ...state.conversations,
                    [activeConversationId]: updatedConversation
                }
            };
        });
    },

    // 删除指定对话
    deleteConversation: (id) => {
        set(state => {
            const { [id]: deleted, ...remainingConversations } = state.conversations;
            const activeId = state.activeConversationId === id
                ? Object.keys(remainingConversations)[0] ?? null
                : state.activeConversationId;

            return {
                conversations: remainingConversations,
                activeConversationId: activeId
            };
        });
    },

    // 清空所有对话
    clearConversations: () => set({ conversations: {}, activeConversationId: null }),

    // 设置加载状态
    setLoading: (isLoading) => set({ isLoading })
}));
