import { UICard, UICardGradient } from './ui/UICard';

interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  text: string;
}

interface SmartValidationMessageProps {
  messages: ValidationMessage[];
}

export function SmartValidationMessage({ messages }: SmartValidationMessageProps) {
  // Priority: error > warning > info > success
  const priority = { error: 4, warning: 3, info: 2, success: 1 };

  const topMessage = messages.reduce((top, msg) => {
    if (!top || priority[msg.type] > priority[top.type]) {
      return msg;
    }
    return top;
  }, null as ValidationMessage | null);

  if (!topMessage) return null;

  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅'
  };

  const gradientMap: Record<string, UICardGradient> = {
    error: 'error',
    warning: 'warning',
    info: 'info',
    success: 'success'
  };

  return (
    <UICard
      variant="gradient"
      gradient={gradientMap[topMessage.type]}
      size="sm"
      className="border-2 flex items-center gap-2 shadow-md transition-all duration-200 h-14"
      data-testid={`validation-message-${topMessage.type}`}
    >
      <div role="alert" aria-live="polite" className="flex items-center gap-2 w-full">
        <span className="text-xl flex-shrink-0">{iconMap[topMessage.type]}</span>
        <span className="font-semibold text-sm flex-1">{topMessage.text}</span>
      </div>
    </UICard>
  );
}
