import React from 'react';
import { FaRobot } from 'react-icons/fa';
import { useAIStore } from './AIStore';
import { useTranslation } from '@/hooks/useTranslation';
import Button from '@/components/Button';

const AIChatToggler: React.FC = () => {
    const { isAISidebarVisible, setAISidebarVisible } = useAIStore();
    const _ = useTranslation();

    return (
        <Button
            icon={<FaRobot className={`text-base-content ${isAISidebarVisible ? 'text-primary' : ''}`} />}
            onClick={() => setAISidebarVisible(!isAISidebarVisible)}
            tooltip={_('AI助手')}
            tooltipDirection='bottom'
        />
    );
};

export default AIChatToggler; 