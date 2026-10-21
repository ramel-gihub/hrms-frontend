import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

export default function MetricCard({ title, value, change, isPositive = true, icon, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    orange: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
            {value}
          </h4>
        </div>

        {change && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPositive 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          }`}>
            {isPositive ? <ArrowUpIcon className="w-3.5 h-3.5" /> : <ArrowDownIcon className="w-3.5 h-3.5" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
