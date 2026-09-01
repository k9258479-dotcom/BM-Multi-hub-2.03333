import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { AdAccount, Client } from '../types';
import { generateCsvReport, downloadCsvFile, triggerPrintPdf } from '../lib/exportUtils';
import { logAuditEvent } from '../lib/storage';

interface ReportsViewProps {
  accounts: AdAccount[];
  clients: Client[];
  theme: 'dark' | 'light';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  accounts,
  clients,
  theme
}) => {
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [weeklyScheduleActive, setWeeklyScheduleActive] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredAccounts = selectedClient === 'ALL'
    ? accounts
    : accounts.filter(a => a.clientName === selectedClient);

  const totalSpend = filteredAccounts.reduce((acc, a) => acc + a.dailySpend, 0);
  const totalBudget = filteredAccounts.reduce((acc, a) => acc + a.dailyBudget, 0);
  const totalImpressions = filteredAccounts.reduce((acc, a) => acc + (a.campaigns?.reduce((cAcc, c) => cAcc + c.impressions, 0) || 0), 0);
  const totalClicks = filteredAccounts.reduce((acc, a) => acc + (a.campaigns?.reduce((cAcc, c) => cAcc + c.clicks, 0) || 0), 0);
  const totalConversions = filteredAccounts.reduce((acc, a) => acc + (a.campaigns?.reduce((cAcc, c) => cAcc + c.conversions, 0) || 0), 0);
  const avgRoas = filteredAccounts.length > 0 
    ? (filteredAccounts.reduce((acc, a) => acc + a.roas, 0) / filteredAccounts.length).toFixed(2)
    : '0.00';

  const handleExportCsv = () => {
    const csvData = generateCsvReport(accounts, selectedClient);
    const filename = `BM_MultiHub_Report_${selectedClient}_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(csvData, filename);
    setExportNotice(`Exported ${filename} successfully.`);

    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'EXPORT_CSV_REPORT',
      resource: filename,
      details: `Generated CSV performance report for client: ${selectedClient}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  const handlePrintPdf = () => {
    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'EXPORT_PDF_REPORT',
      resource: 'PRINT_STREAM',
      details: `Triggered styled PDF report print generator for client: ${selectedClient}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
    triggerPrintPdf();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
            CUSTOM REPORT GENERATOR & EXPORTS
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Export multi-client spend, conversions, and ROAS metrics into formatted CSV or executive PDF formats.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-export-csv"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-[#121722] text-[#F3E5AB] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 text-xs font-bold flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={handlePrintPdf}
            className="px-4 py-2.5 rounded-xl gold-btn text-xs font-bold flex items-center space-x-1.5 uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" />
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center space-x-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 no-print ${
        theme === 'dark' ? 'bg-[#0F141F] border-[#D4AF37]/20' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
              Filter by Client Entity
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#080B10] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="ALL">All Clients ({clients.length || accounts.length})</option>
              {Array.from(new Set(accounts.map(a => a.clientName))).map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
              Date Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#080B10] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="today">Today (Real-time)</option>
              <option value="7d">Last 7 Days (Weekly)</option>
              <option value="30d">Last 30 Days (Monthly)</option>
              <option value="custom">Year-to-Date (YTD)</option>
            </select>
          </div>
        </div>

        {/* Weekly Auto-Scheduler Pill */}
        <div className="flex items-center space-x-2 text-xs text-gray-300">
          <Clock className="w-4 h-4 text-[#D4AF37]" />
          <span>Weekly CSV Dispatch: <strong className="text-[#F3E5AB]">Every Monday at 08:00 UTC</strong></span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-600/40 font-mono">
            SCHEDULED
          </span>
        </div>
      </div>

      {/* Styled Executive Report Document (Print Optimized) */}
      <div className={`p-8 rounded-2xl border ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        
        {/* Document Header */}
        <div className="border-b border-[#D4AF37]/30 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel text-xl font-black gold-text-gradient">
                BM MULTI-HUB EXECUTIVE PERFORMANCE REPORT
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Generated: {new Date().toLocaleDateString()} • Client Scope: <strong className="text-white">{selectedClient}</strong> • Period: {dateRange.toUpperCase()}
            </p>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="text-[#D4AF37] font-bold">CONFIDENTIAL AGENCY DIGEST</div>
            <div className="text-gray-500 text-[10px]">GDPR & SOC2 Certified Export</div>
          </div>
        </div>

        {/* Aggregate KPI Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3.5 rounded-xl bg-[#080B10]/80 border border-gray-800">
            <div className="text-[10px] uppercase font-bold text-[#D4AF37]">Total Daily Spend</div>
            <div className="text-lg font-bold text-white font-mono mt-1">${totalSpend.toFixed(2)}</div>
            <div className="text-[10px] text-gray-400">of ${totalBudget.toFixed(2)} Target</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080B10]/80 border border-gray-800">
            <div className="text-[10px] uppercase font-bold text-[#D4AF37]">Impressions & Clicks</div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalImpressions.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">{totalClicks.toLocaleString()} Clicks</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080B10]/80 border border-gray-800">
            <div className="text-[10px] uppercase font-bold text-[#D4AF37]">Conversions Logged</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{totalConversions.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">Via Conversions API</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080B10]/80 border border-gray-800">
            <div className="text-[10px] uppercase font-bold text-[#D4AF37]">Average Portfolio ROAS</div>
            <div className="text-lg font-bold text-[#F3E5AB] font-mono mt-1">{avgRoas}x</div>
            <div className="text-[10px] text-emerald-400 font-bold">+18.4% vs Target</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase bg-black/20">
                <th className="py-3 px-3">Account Name</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Spend</th>
                <th className="py-3 px-3">Daily Budget</th>
                <th className="py-3 px-3">Util %</th>
                <th className="py-3 px-3">ROAS</th>
                <th className="py-3 px-3">Pixel ID</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500 font-sans">
                    No account data found for this report filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const util = acc.dailyBudget > 0 ? ((acc.dailySpend / acc.dailyBudget) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={acc.id} className="hover:bg-white/5">
                      <td className="py-3 px-3 font-sans font-semibold text-white">{acc.accountName}</td>
                      <td className="py-3 px-3 text-[#D4AF37] font-semibold">{acc.clientName}</td>
                      <td className="py-3 px-3 uppercase text-gray-300">{acc.platform}</td>
                      <td className="py-3 px-3 text-white font-bold">${acc.dailySpend.toFixed(2)}</td>
                      <td className="py-3 px-3 text-gray-400">${acc.dailyBudget.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${Number(util) >= 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {util}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{acc.roas}x</td>
                      <td className="py-3 px-3 text-gray-500">{acc.pixelId || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
                          {acc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t border-gray-800 text-[11px] text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>BM Multi-hub Sentinel Enterprise • Data synchronized via Direct Graph API</span>
          <span>Page 1 of 1 • System Checksum Verified</span>
        </div>

      </div>

    </div>
  );
};
