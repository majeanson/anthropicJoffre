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

  const styles = {
    error: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-500 dark:border-red-700',
      text: 'text-red-800 dark:text-red-300',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-500 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-500 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-300',
      icon: 'ℹ️'
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-500 dark:border-green-700',
      text: 'text-green-800 dark:text-green-300',
      icon: '✅'
    }
  };

  const style = styles[topMessage.type];

  return (
    <div
      className={`${style.bg} ${style.border} ${style.text} border-2 rounded-lg px-4 py-3 flex items-center gap-2 shadow-md transition-all duration-200 h-14`}
      data-testid={`validation-message-${topMessage.type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl flex-shrink-0">{style.icon}</span>
      <span className="font-semibold text-sm flex-1">{topMessage.text}</span>
    </div>
  );
}
