import React, { useState, useMemo } from 'react';
import { ShoppingCart, PhilippinePeso, Package, Printer, Calendar, ChevronDown, Download } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { Order, Product } from '@/types';
import { toast } from '@/hooks/use-toast';

type Timeframe = 'all' | 'daily' | 'weekly' | 'monthly' | 'last_month' | 'specific_month' | 'yearly' | 'custom';

export default function AdminReports() {
  const { allOrders } = useOrders();
  const { allProducts } = useProducts();
  const [reportType, setReportType] = useState<'sales' | 'orders' | 'inventory'>('sales');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  });
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const tabs = [
    { id: 'sales', label: 'Sales', icon: PhilippinePeso },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ] as const;

  const parseItemDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };

  const isWithinTimeframe = (dateStr: string) => {
    if (timeframe === 'all' || !dateStr) return true;

    const parsed = parseItemDate(dateStr);
    if (!parsed) return false;

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    if (timeframe === 'daily') {
      return parsed.year === todayYear && parsed.month === todayMonth && parsed.day === todayDay;
    }

    if (timeframe === 'weekly') {
      const itemDate = new Date(parsed.year, parsed.month - 1, parsed.day);
      const weekAgo = new Date(todayYear, todayMonth - 1, todayDay - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(todayYear, todayMonth - 1, todayDay, 23, 59, 59, 999);
      return itemDate >= weekAgo && itemDate <= endOfToday;
    }

    if (timeframe === 'monthly') {
      return parsed.year === todayYear && parsed.month === todayMonth;
    }

    if (timeframe === 'last_month') {
      const lastMonthDate = new Date(todayYear, todayMonth - 2, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthNum = lastMonthDate.getMonth() + 1;
      return parsed.year === lastMonthYear && parsed.month === lastMonthNum;
    }

    if (timeframe === 'specific_month') {
      if (!selectedMonth) return true;
      const [selYear, selMonth] = selectedMonth.split('-').map(Number);
      return parsed.year === selYear && parsed.month === selMonth;
    }

    if (timeframe === 'yearly') {
      return parsed.year === todayYear;
    }

    if (timeframe === 'custom') {
      if (!customRange.start || !customRange.end) return true;
      const [sY, sM, sD] = customRange.start.split('-').map(Number);
      const [eY, eM, eD] = customRange.end.split('-').map(Number);
      const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      const itemDate = new Date(parsed.year, parsed.month - 1, parsed.day);
      return itemDate >= start && itemDate <= end;
    }

    return true;
  };

  const filteredSales = useMemo(() => {
    const completedOrders = allOrders.filter(o => o.status === 'Delivered');
    return completedOrders.filter(o => isWithinTimeframe(o.date));
  }, [allOrders, timeframe, customRange, selectedMonth]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => isWithinTimeframe(o.date));
  }, [allOrders, timeframe, customRange, selectedMonth]);

  const filteredInventory = useMemo(() => {
    return allProducts.filter(p => isWithinTimeframe(p.date || ''));
  }, [allProducts, timeframe, customRange, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const currentMonthYearName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const lastMonthYearName = useMemo(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const timeframeText = useMemo(() => {
    const today = new Date();
    if (timeframe === 'all') return 'All Time';

    if (timeframe === 'daily') {
      return today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (timeframe === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const startStr = weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Last 7 Days (${startStr} – ${endStr})`;
    }

    if (timeframe === 'monthly') {
      return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (timeframe === 'last_month') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (timeframe === 'specific_month') {
      if (!selectedMonth) return 'Selected Month';
      const [selYear, selMonth] = selectedMonth.split('-').map(Number);
      const d = new Date(selYear, selMonth - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (timeframe === 'yearly') {
      return `Year ${today.getFullYear()}`;
    }

    if (timeframe === 'custom') {
      if (customRange.start && customRange.end) {
        const [sY, sM, sD] = customRange.start.split('-').map(Number);
        const [eY, eM, eD] = customRange.end.split('-').map(Number);
        const startD = new Date(sY, sM - 1, sD);
        const endD = new Date(eY, eM - 1, eD);

        // Check if custom range matches full exact month
        const isStartFirstDay = sD === 1;
        const lastDayOfStartMonth = new Date(sY, sM, 0).getDate();
        const isEndLastDay = eD === lastDayOfStartMonth;
        const isSameMonthAndYear = sY === eY && sM === eM;

        if (isStartFirstDay && isEndLastDay && isSameMonthAndYear) {
          return startD.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        const formatOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${startD.toLocaleDateString('en-US', formatOpt)} – ${endD.toLocaleDateString('en-US', formatOpt)}`;
      }
      return 'Custom Date Range';
    }

    return 'Filtered';
  }, [timeframe, customRange, selectedMonth]);

  const downloadCSV = (rows: (string | number)[][], filename: string) => {
    const csvContent =
      '\uFEFF' +
      rows
        .map(row =>
          row
            .map(cell => {
              if (cell === null || cell === undefined) return '""';
              const str = String(cell).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const generatedDateStr = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (reportType === 'sales') {
      if (filteredSales.length === 0) {
        toast({
          title: 'No Data to Download',
          description: `No sales records found for the period: ${timeframeText}.`,
          variant: 'destructive',
        });
        return;
      }

      const totalRevenue = filteredSales.reduce((sum, o) => sum + Number(o.total), 0);
      const totalItemsCount = filteredSales.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

      const rows: (string | number)[][] = [
        ["Rufino's Furniture - Online Shop Management System"],
        ['Sales Report'],
        [`Period: ${timeframeText}`],
        [`Date Generated: ${generatedDateStr}`],
        [''],
        ['Order ID', 'Date', 'Customer', 'Contact', 'Items Details', 'Total Items', 'Payment Method', 'Installation Service', 'Status', 'Revenue (PHP)'],
        ...filteredSales.map(o => [
          o.id,
          o.date,
          o.customerName,
          o.contact,
          o.items.map(i => `${i.product.name} (x${i.quantity})`).join('; '),
          o.items.reduce((s, i) => s + i.quantity, 0),
          o.paymentMethod,
          o.installationSelected ? `Yes (₱${(o.installationFee || 0).toLocaleString()})` : 'No',
          o.deleted ? 'Delivered (Archived)' : 'Delivered',
          Number(o.total).toFixed(2),
        ]),
        [''],
        ['SUMMARY', '', '', '', '', `Total Items: ${totalItemsCount}`, '', '', 'Total Revenue:', Number(totalRevenue).toFixed(2)],
      ];

      downloadCSV(rows, `Rufinos_Furniture_Sales_Report_${timeframe}_${todayStr}.csv`);
      toast({ title: 'Report Downloaded', description: 'Sales report has been downloaded successfully.' });
    } else if (reportType === 'orders') {
      if (filteredOrders.length === 0) {
        toast({
          title: 'No Data to Download',
          description: `No order records found for the period: ${timeframeText}.`,
          variant: 'destructive',
        });
        return;
      }

      const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalItemsCount = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

      const rows: (string | number)[][] = [
        ["Rufino's Furniture - Online Shop Management System"],
        ['Orders Report'],
        [`Period: ${timeframeText}`],
        [`Date Generated: ${generatedDateStr}`],
        [''],
        ['Order ID', 'Date', 'Customer', 'Contact', 'Address', 'Items Details', 'Total Items', 'Payment Method', 'Installation Service', 'Status', 'Est. Delivery', 'Total Amount (PHP)'],
        ...filteredOrders.map(o => [
          o.id,
          o.date,
          o.customerName,
          o.contact,
          o.address,
          o.items.map(i => `${i.product.name} (x${i.quantity})`).join('; '),
          o.items.reduce((s, i) => s + i.quantity, 0),
          o.paymentMethod,
          o.installationSelected ? `Yes (₱${(o.installationFee || 0).toLocaleString()})` : 'No',
          o.deleted ? `${o.status} (Archived)` : o.status,
          o.expectedDeliveryDate,
          Number(o.total).toFixed(2),
        ]),
        [''],
        ['SUMMARY', '', '', '', '', '', `Total Items: ${totalItemsCount}`, '', '', `Total Orders: ${filteredOrders.length}`, 'Total Amount:', Number(totalRevenue).toFixed(2)],
      ];

      downloadCSV(rows, `Rufinos_Furniture_Orders_Report_${timeframe}_${todayStr}.csv`);
      toast({ title: 'Report Downloaded', description: 'Orders report has been downloaded successfully.' });
    } else if (reportType === 'inventory') {
      if (filteredInventory.length === 0) {
        toast({
          title: 'No Data to Download',
          description: `No inventory records found for the period: ${timeframeText}.`,
          variant: 'destructive',
        });
        return;
      }

      const totalStock = filteredInventory.reduce((sum, p) => sum + Number(p.stock), 0);
      const totalInventoryValue = filteredInventory.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);

      const rows: (string | number)[][] = [
        ["Rufino's Furniture - Online Shop Management System"],
        ['Inventory Report'],
        [`Period: ${timeframeText}`],
        [`Date Generated: ${generatedDateStr}`],
        [''],
        ['Product ID', 'Product Name', 'Category', 'Date Added', 'Unit Price (PHP)', 'Stock Level', 'Stock Status', 'Inventory Value (PHP)'],
        ...filteredInventory.map(p => {
          const stockStatus = p.deleted ? 'Archived' : p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'Healthy';
          const value = Number(p.price) * Number(p.stock);
          return [
            p.id,
            p.name,
            p.category,
            p.date || 'N/A',
            Number(p.price).toFixed(2),
            p.stock,
            stockStatus,
            value.toFixed(2),
          ];
        }),
        [''],
        ['SUMMARY', '', '', `Total Products: ${filteredInventory.length}`, '', `Total Stock: ${totalStock}`, 'Total Inventory Value:', Number(totalInventoryValue).toFixed(2)],
      ];

      downloadCSV(rows, `Rufinos_Furniture_Inventory_Report_${timeframe}_${todayStr}.csv`);
      toast({ title: 'Report Downloaded', description: 'Inventory report has been downloaded successfully.' });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-800 tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Comprehensive business insights and historical records</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:bg-emerald-700 transition-all font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition-all font-medium text-sm border border-slate-700/50"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs - Hidden on Print */}
      <div className="print:hidden">
        <div className="inline-flex gap-2 p-1.5 bg-white/80 backdrop-blur-sm w-fit rounded-xl border border-slate-200/60 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                reportType === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className={`h-4.5 w-4.5 ${reportType === tab.id ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters - Hidden on Print */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 md:p-6 print:hidden relative overflow-hidden group">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Timeframe Filter</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter records by date ranges</p>
            </div>
          </div>
          <div className="h-px w-full md:w-px md:h-12 bg-slate-200"></div>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="daily">Daily / Today</option>
                <option value="weekly">Weekly (Last 7 Days)</option>
                <option value="monthly">Monthly ({currentMonthYearName})</option>
                <option value="last_month">Last Month ({lastMonthYearName})</option>
                <option value="specific_month">Specific Month</option>
                <option value="yearly">Yearly ({new Date().getFullYear()})</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {timeframe === 'specific_month' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            )}

            {timeframe === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Title - Only visible on print */}
      <div className="hidden print:block mb-8 text-center border-b pb-6">
        <h1 className="text-3xl font-serif text-black uppercase tracking-widest">{tabs.find(t => t.id === reportType)?.label} Report</h1>
        <p className="text-gray-600 mt-2">Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Report Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 overflow-hidden print:shadow-none print:border-none">

        {/* Table Header Context */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:bg-white print:border-b-2 print:border-black">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 capitalize print:hidden">{reportType} Data</h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 hidden print:inline-block h-2 rounded-full bg-blue-500"></span>
              <span className="font-medium text-slate-700 print:text-black">Period:</span> <span className="print:font-bold">{timeframeText}</span>
            </div>
          </div>
          {reportType === 'sales' && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">₱{filteredSales.reduce((sum, order) => sum + Number(order.total), 0).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {reportType === 'sales' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-sm text-slate-500 border-b border-slate-100 print:bg-gray-100 print:text-black">
                  <th className="font-semibold py-4 px-6 whitespace-nowrap">Order ID</th>
                  <th className="font-semibold py-4 px-6 whitespace-nowrap">Date</th>
                  <th className="font-semibold py-4 px-6">Customer</th>
                  <th className="font-semibold py-4 px-6">Items</th>
                  <th className="font-semibold py-4 px-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-500">No records found for the selected period.</td></tr>
                ) : (
                  filteredSales.map(order => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors print:border-gray-200">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{order.id.slice(0, 8)}...</span>
                          {order.deleted && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 border">Archived</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{order.date}</td>
                      <td className="py-4 px-6 text-sm text-slate-700 font-medium">{order.customerName}</td>
                      <td className="py-4 px-6 text-sm text-slate-500">{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900 text-right">₱{Number(order.total).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'orders' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-sm text-slate-500 border-b border-slate-100 print:bg-gray-100 print:text-black">
                  <th className="font-semibold py-4 px-6 whitespace-nowrap">Order ID</th>
                  <th className="font-semibold py-4 px-6 whitespace-nowrap">Date</th>
                  <th className="font-semibold py-4 px-6">Customer</th>
                  <th className="font-semibold py-4 px-6">Status</th>
                  <th className="font-semibold py-4 px-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-500">No records found for the selected period.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors print:border-gray-200">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{order.id.slice(0, 8)}...</span>
                          {order.deleted && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 border">Archived</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{order.date}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">{order.customerName}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-slate-100 text-slate-800'
                          } print:bg-transparent print:text-black print:border print:border-gray-300
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900 text-right">₱{Number(order.total).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-sm text-slate-500 border-b border-slate-100 print:bg-gray-100 print:text-black">
                  <th className="font-semibold py-4 px-6">Product</th>
                  <th className="font-semibold py-4 px-6">Category</th>
                  <th className="font-semibold py-4 px-6">Date Added</th>
                  <th className="font-semibold py-4 px-6">Price</th>
                  <th className="font-semibold py-4 px-6 text-right">Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-500">No records found for the selected period.</td></tr>
                ) : (
                  filteredInventory.map(product => (
                    <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors print:border-gray-200">
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-md bg-slate-100 overflow-hidden border border-slate-200 print:hidden">
                            <img src={product.image} className="h-full w-full object-cover" alt={product.name} />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">{product.name}</span>
                            {product.deleted && (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 border">Archived</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{product.category}</td>
                      <td className="py-4 px-6 text-sm text-slate-500">{product.date || 'Legacy'}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">₱{Number(product.price).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        {product.deleted ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border">
                            Archived
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${
                            product.stock <= 5 ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' : 'text-slate-900'
                          } print:bg-transparent print:ring-0 print:text-black`}>
                            {product.stock}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
