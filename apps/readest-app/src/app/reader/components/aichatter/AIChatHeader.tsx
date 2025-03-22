import React from 'react';
import { MdClose, MdPushPin, MdOutlinePushPin } from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import clsx from 'clsx';
import { useAIStore } from './AIStore';

/**
 * AI聊天侧边栏的头部组件
 * 提供标题显示、对话管理功能
 */
interface AIChatHeaderProps {
    isPinned: boolean;
    onClose: () => void;
    onTogglePin: () => void;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = ({ isPinned, onClose, onTogglePin }) => {
    const _ = useTranslation();
    const iconSize14 = useResponsiveSize(14);
    const iconSize18 = useResponsiveSize(18);
    const { activeConversationId, conversations } = useAIStore();

    // 修复：conversations是数组，需要使用find方法查找对应的对话
    const currentConversation = activeConversationId
        ? conversations[activeConversationId]
        : null;

    const currentTitle = currentConversation?.title || _('AI助手');

    return (
        <div className="flex h-11 items-center justify-between border-b border-base-300 px-4">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{currentTitle}</h2>
                {activeConversationId && currentConversation && (
                    <span className="text-xs text-gray-500">
                        {currentConversation.messages.length || 0} {_('条消息')}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onTogglePin}
                    className={clsx(
                        'btn btn-ghost btn-circle hidden h-6 min-h-6 w-6 sm:flex',
                        isPinned ? 'bg-base-300' : 'bg-base-300/65',
                    )}
                >
                    {isPinned ? <MdPushPin size={iconSize14} /> : <MdOutlinePushPin size={iconSize14} />}
                </button>
                <button
                    onClick={onClose}
                    className="btn btn-ghost btn-circle h-6 min-h-6 w-6"
                >
                    <MdClose size={iconSize18} />
                </button>
            </div>
        </div>
    );
}; 