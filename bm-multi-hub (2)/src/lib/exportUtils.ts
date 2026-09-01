import { AdAccount, Campaign } from '../types';

export function generateCsvReport(accounts: AdAccount[], filterClientName?: string): string {
  const filtered = filterClientName && filterClientName !== 'ALL'
    ? accounts.filter(a => a.clientName === filterClientName)
    : accounts;

  const headers = [
    'Account ID',
    'Account Name',
    'Client Name',
    'Platform',
    'Status',
    'Daily Budget ($)',
    'Daily Spend ($)',
    'Budget Utilization (%)',
    'Lifetime Spend ($)',
    'Active Ads',
    'ROAS',
    'Pixel ID',
    'Last Synced At'
  ];

  const rows = filtered.map(a => {
    const util = a.dailyBudget > 0 ? ((a.dailySpend / a.dailyBudget) * 100).toFixed(1) : '0.0';
    return [
      `"${a.accountId}"`,
      `"${a.accountName.replace(/"/g, '""')}"`,
      `"${a.clientName.replace(/"/g, '""')}"`,
      `"${a.platform.toUpperCase()}"`,
      `"${a.status}"`,
      a.dailyBudget.toFixed(2),
      a.dailySpend.toFixed(2),
      util,
      a.lifetimeSpend.toFixed(2),
      a.activeAdsCount,
      a.roas.toFixed(2),
      `"${a.pixelId || 'N/A'}"`,
      `"${a.lastSyncedAt}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function generateCampaignDetailsCsv(campaigns: Campaign[], accountName: string): string {
  const headers = [
    'Campaign ID',
    'Campaign Name',
    'Account',
    'Status',
    'Daily Budget ($)',
    'Daily Spend ($)',
    'Impressions',
    'Clicks',
    'CTR (%)',
    'Conversions',
    'ROAS',
    'CPM ($)'
  ];

  const rows = campaigns.map(c => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${accountName}"`,
    `"${c.status}"`,
    c.dailyBudget.toFixed(2),
    c.dailySpend.toFixed(2),
    c.impressions,
    c.clicks,
    c.ctr.toFixed(2),
    c.conversions,
    c.roas.toFixed(2),
    c.cpm.toFixed(2)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintPdf(): void {
  window.print();
}
