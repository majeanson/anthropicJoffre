/**
 * StatCard Component
 *
 * Displays a statistic with icon, value, and label.
 * Used in profile and progress modals.
 */

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  className?: string;
}

export function StatCard({ icon, label, value, suffix, className = '' }: StatCardProps) {
  return (
    <div className={`p-3 rounded-lg text-center bg-skin-secondary ${className}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-skin-primary">
        {value.toLocaleString()}
        {suffix && <span className="text-xs font-normal ml-1 text-skin-muted">{suffix}</span>}
      </div>
      <div className="text-xs text-skin-muted">{label}</div>
    </div>
  );
}
