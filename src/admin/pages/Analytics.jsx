import React from 'react';
import Chart from 'react-apexcharts';

export default function Analytics({ employees = [], leaveRequests = [], adminRequests = [] }) {
  // Monthly series chart
  const lineOptions = {
    chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' },
    colors: ['#3c50e0', '#10b981', '#f59e0b'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
    grid: { borderColor: '#f1f5f9' },
    legend: { position: 'top' }
  };

  const lineSeries = [
    { name: 'Active Headcount', data: [15, 16, 18, 19, 20, 21, 22, 23, 23, 24, 24, 25] },
    { name: 'Leave Requests Approved', data: [2, 3, 1, 4, 2, 5, 3, 2, 4, 3, 1, 2] },
    { name: 'Attendance Corrections', data: [1, 2, 0, 1, 3, 2, 1, 0, 2, 1, 1, 0] }
  ];

  // Requests by Category Bar Chart
  const barOptions = {
    chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' },
    colors: ['#3c50e0'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Leave', 'WFH', 'Attendance', 'Assets', 'Claims', 'General'] }
  };

  const barSeries = [
    { name: 'Total Volume', data: [leaveRequests.length || 18, 5, 8, 4, 3, 6] }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics & HR Metrics
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detailed metrics, absence ratios, organizational turnover, and request distributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Annual Headcount & Leave Trends
          </h3>
          <Chart options={lineOptions} series={lineSeries} type="line" height={320} />
        </div>

        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Request Distribution by Category
          </h3>
          <Chart options={barOptions} series={barSeries} type="bar" height={320} />
        </div>
      </div>
    </div>
  );
}
