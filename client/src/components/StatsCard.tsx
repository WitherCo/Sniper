import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  changeLabel?: string;
  changeType?: "increase" | "decrease" | "neutral";
  percentage?: number;
  color: "blue" | "green" | "yellow" | "purple";
}

export default function StatsCard({
  title,
  value,
  changeLabel,
  changeType = "neutral",
  percentage,
  color
}: StatsCardProps) {
  // Map color names to Tailwind classes
  const colorClasses = {
    blue: "bg-[#5865F2] bg-opacity-20 text-[#5865F2]",
    green: "bg-[#57F287] bg-opacity-20 text-[#57F287]",
    yellow: "bg-[#FEE75C] bg-opacity-20 text-[#FEE75C]",
    purple: "bg-purple-500 bg-opacity-20 text-purple-400"
  };

  // Map indicator colors for progress bars
  const indicatorColors = {
    blue: "bg-[#5865F2]",
    green: "bg-[#57F287]",
    yellow: "bg-[#FEE75C]",
    purple: "bg-purple-400"
  };

  return (
    <div className="bg-[#36393F] rounded-lg p-5 border border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-[#B9BBBE] text-sm font-medium">{title}</h3>
        {changeLabel && (
          <span className={cn("px-2 py-1 rounded text-xs", colorClasses[color])}>
            {changeLabel}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      
      {percentage !== undefined ? (
        <div className="flex items-center mt-2 text-xs text-[#B9BBBE]">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className={cn("h-1 rounded-full", indicatorColors[color])} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="ml-2">{percentage}%</span>
        </div>
      ) : changeType === "increase" ? (
        <div className="flex items-center mt-2 text-xs text-[#B9BBBE]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="ml-1">12% increase</span>
        </div>
      ) : null}
    </div>
  );
}
