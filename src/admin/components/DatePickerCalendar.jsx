import React, { useState, useEffect } from 'react';
import { CalendarIcon } from './Icons';

export default function DatePickerCalendar({
  value,
  onChange,
  placeholder = "Click to select holiday date",
  required = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Initialize view date based on current value or today
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Previous month days for padding
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  const handleSelectDay = (day) => {
    const formatted = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
    onChange(formatted);
  };

  const handleSelectToday = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const now = new Date();
    const formatted = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(formatted);
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
  };

  // Format value for input display
  const getDisplayValue = () => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day) => {
    if (!value) return false;
    const formatted = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
    return value === formatted;
  };

  // Years range: 3 years back to 8 years forward
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 3; y <= currentYear + 8; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Clickable Date Display Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 cursor-pointer shadow-sm hover:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className={value ? "font-bold text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
            {value ? getDisplayValue() : placeholder}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          {isOpen ? "Hide Calendar ▲" : "Show Calendar ▼"}
        </button>
      </div>

      {/* Hidden input for form required validation */}
      <input
        type="text"
        required={required}
        value={value}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Interactive In-Modal Calendar Picker */}
      {isOpen && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-850">
          {/* Calendar Header: Month, Year, Nav */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-sm transition-colors text-base font-bold"
              title="Previous month"
            >
              ‹
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-800 dark:text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-800 dark:text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-sm transition-colors text-base font-bold"
              title="Next month"
            >
              ›
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((d, i) => (
              <div
                key={i}
                className="text-[11px] font-bold text-gray-400 uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayIndex + 1 + i;
              return (
                <div
                  key={`prev-${i}`}
                  className="flex h-7 w-7 items-center justify-center text-xs text-gray-300 dark:text-gray-600 select-none mx-auto"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const current = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`flex h-7 w-7 items-center justify-center text-xs rounded-xl font-semibold mx-auto transition-all cursor-pointer ${
                    selected
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600 scale-105"
                      : current
                      ? "border border-emerald-500 bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100"
                      : "text-gray-700 bg-white hover:bg-emerald-100 hover:text-emerald-800 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-xs"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-gray-700 pt-2.5 mt-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
            <span className="text-[11px] text-gray-400 font-medium">
              Click any date to pick
            </span>
            <button
              type="button"
              onClick={handleSelectToday}
              className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
