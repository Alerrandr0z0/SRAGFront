import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

interface DonutChartProps {
  chartTitle: string;
  options: ApexOptions;
  series: number[];
  centerLabel?: string;
  centerValue?: string | number;
  height?: number;
  customLegend?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
  chartTitle,
  options,
  series,
  centerLabel,
  centerValue,
  height = 350,
  customLegend = false,
}) => {
  const mergedOptions: ApexOptions = useMemo(() => {
    let next = options;
    if (centerLabel !== undefined || centerValue !== undefined) {
      const pie = (next.plotOptions as { pie?: { donut?: object } } | undefined)?.pie ?? {};
      next = {
        ...next,
        plotOptions: {
          ...(next.plotOptions ?? {}),
          pie: {
            ...pie,
            donut: {
              ...(pie.donut ?? {}),
              labels: {
                show: true,
                total: {
                  show: true,
                  showAlways: true,
                  label: centerLabel ?? '',
                  formatter: () => String(centerValue ?? ''),
                },
              },
            },
          },
        },
      };
    }
    if (customLegend) {
      next = { ...next, legend: { ...(next.legend ?? {}), show: false } };
    }
    return next;
  }, [options, centerLabel, centerValue, customLegend]);

  const legendItems = useMemo(() => {
    if (!customLegend) return [];
    const labels = Array.isArray(options.labels) ? options.labels.map(String) : [];
    const colors = Array.isArray(options.colors) ? (options.colors as string[]) : [];
    return labels.map((label, i) => ({
      label,
      color: colors.length > 0 ? colors[i % colors.length] : '#94A3B8',
    }));
  }, [options, customLegend]);

  return (
    <div
      role="img"
      aria-label={chartTitle}
      className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5 w-full h-full flex flex-col justify-between overflow-visible"
    >
      <div className="flex flex-col justify-between md:flex-row items-center">
        <h2 className="text-center text-black dark:text-white font-semibold text-lg">
          {chartTitle}
        </h2>
      </div>
      <div className="mb-2">
        <div className="mx-auto flex justify-center text-black dark:text-white">
          <ReactApexChart options={mergedOptions} series={series} type="donut" height={height} />
        </div>
      </div>
      {legendItems.length > 0 && (
        <div className="flex flex-wrap justify-center content-start gap-x-3 gap-y-1.5 px-1 pb-1 min-h-[3.5rem] text-xs text-black dark:text-white">
          {legendItems.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
