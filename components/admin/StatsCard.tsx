import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    label: string;
  };
}

export function StatsCard({ label, value, icon: Icon, change }: StatsCardProps) {
  const isPositive = change && change.value >= 0;

  return (
    <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption uppercase tracking-wider text-gema-gray-400 mb-2">
            {label}
          </p>
          <p className="text-heading-lg text-gema-black">{value}</p>

          {change && (
            <p
              className={`text-caption mt-2 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {change.value}% {change.label}
            </p>
          )}
        </div>
        <div className="p-2 bg-gema-gray-50 rounded">
          <Icon size={20} className="text-gema-gray-400" />
        </div>
      </div>
    </div>
  );
}
