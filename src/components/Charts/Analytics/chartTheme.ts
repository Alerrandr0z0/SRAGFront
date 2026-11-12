export interface ChartTheme {
  text: string;
  muted: string;
  grid: string;
  tooltipBg: string;
  tooltipText: string;
}

export function chartTheme(isDark: boolean): ChartTheme {
  if (isDark) {
    return {
      text: '#DEE4EE',
      muted: '#8A99AF',
      grid: '#2E3A47',
      tooltipBg: '#24303F',
      tooltipText: '#DEE4EE',
    };
  }
  return {
    text: '#1C2434',
    muted: '#64748B',
    grid: '#E2E8F0',
    tooltipBg: '#FFFFFF',
    tooltipText: '#1C2434',
  };
}
