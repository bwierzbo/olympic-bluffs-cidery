'use client';

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export default function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps) {
  const hasValue = dateFrom || dateTo;

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className={`px-2 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 ${
          dateFrom ? 'border-sage-300 bg-sage-50' : 'border-gray-300 bg-white'
        }`}
        title="From date"
      />
      <span className="text-gray-400 text-xs">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className={`px-2 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 ${
          dateTo ? 'border-sage-300 bg-sage-50' : 'border-gray-300 bg-white'
        }`}
        title="To date"
      />
      {hasValue && (
        <button
          onClick={() => { onDateFromChange(''); onDateToChange(''); }}
          className="p-1.5 text-gray-400 hover:text-gray-600"
          title="Clear dates"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
