import React, { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIStore } from './AIStore';
import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useDrag } from '@/hooks/useDrag';
import { AIChatHeader } from './AIChatHeader';
import { AIChatMessages } from './AIChatMessages';
import AIInput from './AIInput';
import { eventDispatcher } from '@/utils/event';
import clsx from 'clsx';

interface AIChatEvent extends CustomEvent {
    detail: {
        text: string;
    };
}

const MIN_SIDEBAR_WIDTH = 0.15;
const MAX_SIDEBAR_WIDTH = 0.45;

const AISidebar: React.FC = () => {
    const _ = useTranslation();
    const { appService } = useEnv();
    const { updateAppTheme } = useThemeStore();
    const {
        isAISidebarVisible,
        setAISidebarVisible,
        aiSidebarWidth,
        setAISidebarWidth,
        isAISidebarPinned,
        toggleAISidebarPin,
        createNewConversation,
        addUserMessage,
        setLoading,
        updateAssistantMessage
    } = useAIStore();
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAISidebarVisible) {
            updateAppTheme('base-200');
        } else {
            updateAppTheme('base-100');
        }
    }, [isAISidebarVisible, updateAppTheme]);

    const handleResize = (data: { clientX: number }) => {
        const widthFraction = data.clientX / window.innerWidth;
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, widthFraction));
        setAISidebarWidth(`${Math.round(newWidth * 10000) / 100}%`);
    };

    const { handleDragStart } = useDrag(handleResize);

    const handleClickOverlay = () => {
        if (!isAISidebarPinned) {
            setAISidebarVisible(false);
        }
    };

    useEffect(() => {
        const handleAIChatEvent = (event: AIChatEvent) => {
            const { text } = event.detail;
            setAISidebarVisible(true);

            const conversationId = createNewConversation();
            addUserMessage(text);
            handleSend(text);
        };

        eventDispatcher.on('ai-chat', handleAIChatEvent);
        return () => {
            eventDispatcher.off('ai-chat', handleAIChatEvent);
        };
    }, [setAISidebarVisible, createNewConversation, addUserMessage]);

    const handleSend = async (message: string) => {
        try {
            setLoading(true);
            updateAssistantMessage('');
            // TODO: 实现发送消息的逻辑
            // 这里可以调用 AI 服务或更新状态
        } catch (error) {
            console.error('发送消息失败:', error);
            updateAssistantMessage('发送消息失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    if (!isAISidebarVisible) return null;

    return (
        <>
            {!isAISidebarPinned && (
                <div
                    className="fixed inset-0 z-10 bg-black/20"
                    onClick={handleClickOverlay}
                />
            )}
            <div
                ref={sidebarRef}
                className={clsx(
                    'ai-sidebar-container bg-base-200 z-20 flex min-w-60 select-none flex-col',
                    appService?.isIOSApp ? 'h-[100vh]' : 'h-full',
                    appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]',
                    appService?.hasRoundedWindow && 'rounded-window-top-right rounded-window-bottom-right',
                    !isAISidebarPinned && 'shadow-2xl',
                )}
                style={{
                    width: aiSidebarWidth,
                    maxWidth: `${MAX_SIDEBAR_WIDTH * 100}%`,
                    position: isAISidebarPinned ? 'relative' : 'absolute',
                    right: 0,
                    top: 0,
                }}
            >
                <style jsx>{`
                    @media (max-width: 640px) {
                        .ai-sidebar-container {
                            width: 100%;
                            min-width: 100%;
                        }
                    }
                `}</style>
                <div
                    className="drag-bar absolute left-0 top-0 h-full w-0.5 cursor-col-resize"
                    onMouseDown={handleDragStart}
                />
                <AIChatHeader
                    isPinned={isAISidebarPinned}
                    onClose={() => setAISidebarVisible(false)}
                    onTogglePin={toggleAISidebarPin}
                />
                <AIChatMessages />
                <AIInput onSend={handleSend} />
            </div>
        </>
    );
};

export default AISidebar;