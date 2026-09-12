import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';

interface ParetoData {
  labels: string[];
  bars: number[];
  cumulative: number[];
}

interface ParetoChartProps {
  title: string;
  data: ParetoData;
}

/**
 * Pareto: barras ordenadas (casos) + linha de % acumulada das menções.
 */
const ParetoChart: React.FC<ParetoChartProps> = ({ title, data }) => {
  const options: ApexOptions = {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'line',
      toolbar: { show: false },
    },
    colors: ['#3C50E0', '#E03C3C'],
    stroke: { width: [0, 3] },
    markers: { size: [0, 4], colors: ['#E03C3C'] },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1],
      formatter: (val: number) => `${val}%`,
      offsetY: -8,
      style: { fontSize: '11px', colors: ['#E03C3C'] },
    },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    xaxis: { categories: data.labels.length > 0 ? data.labels : ['Sem dados'] },
    yaxis: [
      { title: { text: 'Casos' } },
      {
        opposite: true,
        min: 0,
        max: 100,
        title: { text: '% acumulado' },
        labels: { formatter: (val: number) => `${Math.round(val)}%` },
      },
    ],
    legend: { position: 'top', horizontalAlign: 'left' },
    tooltip: {
      shared: true,
      y: [
        { formatter: (value: number) => `${Math.round(value)} casos` },
        { formatter: (value: number) => `${value}% acumulado` },
      ],
    },
  };

  const series = [
    { name: 'Casos', type: 'column' as const, data: data.bars },
    { name: '% acumulado', type: 'line' as const, data: data.cumulative },
  ];

  return (
    <div
      role="img"
      aria-label={title}
      className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden"
    >
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
        </div>
      </div>

      <div>
        <div className="-ml-5 -mb-9">
          <ReactApexChart options={options} series={series} type="line" height={380} />
        </div>
      </div>
    </div>
  );
};

export default ParetoChart;
