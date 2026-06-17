import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioAllocationChartProps {
  data: {
    sectors: {
      name: string;
      value: number;
      color: string;
    }[];
  };
}

export function PortfolioAllocationChart({ data }: PortfolioAllocationChartProps) {
  const chartData = {
    labels: data.sectors.map(sector => sector.name),
    datasets: [
      {
        data: data.sectors.map(sector => sector.value),
        backgroundColor: data.sectors.map(sector => sector.color),
        borderColor: data.sectors.map(sector => sector.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <div className="w-full h-80 flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}