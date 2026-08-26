import React, { useState, useMemo } from 'react';
import { ShoppingCart, PhilippinePeso, Package, Printer, Calendar, ChevronDown, Download } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { Order, Product } from '@/types';

type Timeframe = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export default function AdminReports() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [reportType, setReportType] = useState<'sales' | 'orders' | 'inventory'>('sales');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const tabs = [
    { id: 'sales', label: 'Sales', icon: PhilippinePeso },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ] as const;

  const isWithinTimeframe = (dateStr: string) => {
    if (timeframe === 'all' || !dateStr) return true;

    // Parse order/product date. Ensure you have the date.
    // If dateStr is not provided, we consider it to be within? Wait, no, false. But let's handle "all" earlier.
    const date = new Date(dateStr);
    const today = new Date();

    if (timeframe === 'daily') {
      return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    }

    if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      return date >= weekAgo && date <= today;
    }

    if (timeframe === 'monthly') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }

    if (timeframe === 'yearly') {
      return date.getFullYear() === today.getFullYear();
    }

    if (timeframe === 'custom') {
      if (!customRange.start || !customRange.end) return true;
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      return date >= start && date <= end;
    }

    return true;
  };

  const filteredSales = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'Delivered');
    return completedOrders.filter(o => isWithinTimeframe(o.date));
  }, [orders, timeframe, customRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => isWithinTimeframe(o.date));
  }, [orders, timeframe, customRange]);

  const filteredInventory = useMemo(() => {
    return products.filter(p => isWithinTimeframe(p.date || ''));
  }, [products, timeframe, customRange]);

  const handlePrint = () => {
    window.print();
  };

  const timeframeText = useMemo(() => {
    if (timeframe === 'all') return 'All Time';
    const labels: Record<string, string> = {
      daily: 'Today',
      weekly: 'Last 7 Days',
      monthly: 'This Month',
      yearly: 'This Year'
    };
    if (timeframe === 'custom') {
      return customRange.start && customRange.end
        ? `${customRange.start} to ${customRange.end}`
        : 'Custom Range';
    }
    return labels[timeframe] || 'Filtered';
  }, [timeframe, customRange]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-800 tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Comprehensive business insights and data</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition-all font-medium text-sm border border-slate-700/50"
        >
          <Printer className="w-4 h-4" />
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Tabs - Hidden on Print */}
      <div className="print:hidden">
        <div className="inline-flex gap-2 p-1.5 bg-white/80 backdrop-blur-sm w-fit rounded-xl border border-slate-200/60 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${reportType === tab.id
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
                <option value="monthly">Monthly (This Month)</option>
                <option value="yearly">Yearly (This Year)</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">{order.id.slice(0, 8)}...</td>
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
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">{order.id.slice(0, 8)}...</td>
                      <td className="py-4 px-6 text-sm text-slate-500">{order.date}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">{order.customerName}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'Processing' ? 'bg-purple-100 text-purple-800' :
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
                          <span className="font-medium text-slate-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{product.category}</td>
                      <td className="py-4 px-6 text-sm text-slate-500">{product.date || 'Legacy'}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">₱{Number(product.price).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${product.stock <= 5 ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' : 'text-slate-900'
                          } print:bg-transparent print:ring-0 print:text-black`}>
                          {product.stock}
                        </span>
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
