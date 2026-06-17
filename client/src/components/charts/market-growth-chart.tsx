import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MarketGrowthChartProps {
  data: {
    country: string;
    industry: string;
    marketSize: string;
    growthRate: string;
    projections?: {
      year: number;
      value: number;
    }[];
  };
}

export function MarketGrowthChart({ data }: MarketGrowthChartProps) {
  const currentMarketSize = parseFloat(data.marketSize.replace(/[^0-9.]/g, ''));
  const growthRate = parseFloat(data.growthRate.replace('%', '')) / 100;
  
  // Generate 5-year projections based on growth rate
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);
  const projectedValues = years.map((year, index) => {
    const projectedValue = currentMarketSize * Math.pow(1 + growthRate, index);
    return projectedValue;
  });

  const chartData = {
    labels: years.map(year => year.toString()),
    datasets: [
      {
        label: `${data.industry} Market Size (${data.country})`,
        data: projectedValues,
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Market Growth Projection - ${data.country} ${data.industry}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Market Size: $${value.toFixed(2)}B`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Market Size (Billions USD)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value + 'B';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year'
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <div className="w-full h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}