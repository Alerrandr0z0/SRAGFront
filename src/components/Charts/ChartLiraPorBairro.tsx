import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

import { indiceMedido } from '../../pages/Lira/liraDados';
import type { LiraData } from '../../pages/Lira/liraDados';

interface ChartLiraPorBairroProps {
  data: LiraData[];
}

const ChartLiraPorBairro: React.FC<ChartLiraPorBairroProps> = ({ data }) => {
  const validData = data.filter(d => d && d.bairro != null);

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: validData.map((d) => d.bairro),
      title: {
        text: 'Bairro',
      },
    },
    yaxis: {
      title: {
        text: 'Índice',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          if (indiceMedido(val)) {
            return val.toFixed(2);
          }
          return 'Sem medição';
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetX: 40,
    },
  };

  const series = [
    {
      name: 'Índice de Infestação Predial',
      data: validData.map((d) => indiceMedido(d.indiceInfestacaoPredial) ? d.indiceInfestacaoPredial : null),
    },
    {
      name: 'Índice de Breteau',
      data: validData.map((d) => indiceMedido(d.indiceBreteau) ? d.indiceBreteau : null),
    },
  ];

  return (
    <div className="overflow-hidden">
      <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        Índices sem medição não possuem barra; os bairros permanecem no gráfico.
      </p>
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </div>
  );
};

export default ChartLiraPorBairro;
