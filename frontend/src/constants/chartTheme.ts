export const chartTheme = {
  grid: 'var(--color-chart-grid)',
  axis: 'var(--color-chart-axis)',
  tooltip: {
    backgroundColor: 'var(--color-chart-tooltip-bg)',
    borderColor: 'var(--color-chart-tooltip-border)',
    color: 'var(--color-chart-tooltip-text)',
    borderRadius: '24px',
    borderWidth: '1px',
    boxShadow: '0 20px 60px var(--shadow-card-color)'
  },
  legend: {
    color: 'var(--color-chart-axis)'
  }
} as const;
