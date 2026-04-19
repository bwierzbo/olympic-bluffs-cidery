interface OrderAgeProps {
  createdAt: string;
}

function formatAge(isoDate: string): { text: string; urgency: 'normal' | 'warning' | 'urgent' } {
  const ms = Date.now() - new Date(isoDate).getTime();
  const hours = ms / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    return { text: `${mins}m ago`, urgency: 'normal' };
  }
  if (hours < 24) {
    return { text: `${Math.floor(hours)}h ago`, urgency: 'normal' };
  }
  if (days < 3) {
    return { text: `${Math.floor(days)}d ago`, urgency: 'warning' };
  }
  if (days < 7) {
    return { text: `${Math.floor(days)}d ago`, urgency: 'urgent' };
  }
  return { text: `${Math.floor(days / 7)}w ago`, urgency: 'urgent' };
}

const URGENCY_STYLES = {
  normal: 'text-gray-500',
  warning: 'text-amber-600',
  urgent: 'text-red-600 font-semibold',
};

export default function OrderAge({ createdAt }: OrderAgeProps) {
  const { text, urgency } = formatAge(createdAt);

  return (
    <span className={`text-xs ${URGENCY_STYLES[urgency]}`}>
      {text}
    </span>
  );
}
