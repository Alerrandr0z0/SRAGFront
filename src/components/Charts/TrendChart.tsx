import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';

interface LineChartData {
  options: ApexOptions;
  series: {
    name: string;
    data: Array<number | null>;
  }[];
}

const TrendChart: React.FC<LineChartData> = ({ options, series }) => {
  const chartLabel =
    typeof options.title?.text === 'string' ? options.title.text : 'Gráfico de tendência';
  return (
    <div
      role="img"
      aria-label={chartLabel}
      className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8 w-full overflow-hidden"
    >
      <div>
        <div className="-ml-5">
          <ReactApexChart options={options} series={series} type="line" height={350} />
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
