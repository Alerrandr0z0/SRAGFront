import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';

interface ColumnGraphicProps {
  title: string;
  options: ApexOptions;
  series: {
    name: string;
    data: number[];
  }[];
  horizontal?: boolean;
  height?: number;
}

const ColumnGraphic: React.FC<ColumnGraphicProps> = ({
  title,
  options,
  series,
  horizontal = false,
  height = 350,
}) => {
  const mergedOptions: ApexOptions = horizontal
    ? {
        ...options,
        plotOptions: {
          ...(options.plotOptions ?? {}),
          bar: {
            ...((options.plotOptions as { bar?: object } | undefined)?.bar ?? {}),
            horizontal: true,
          },
        },
      }
    : options;
  return (
    <div
      role="img"
      aria-label={title}
      className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark lg:col-span-5 overflow-hidden"
    >
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
        </div>
      </div>

      <div>
        <div className="-ml-5 -mb-9">
          <ReactApexChart options={mergedOptions} series={series} type="bar" height={height} />
        </div>
      </div>
    </div>
  );
};

export default ColumnGraphic;
