import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RiskAssessmentChartProps {
  data: {
    categories: {
      name: string;
      riskScore: number;
      maxScore: number;
    }[];
  };
}

export function RiskAssessmentChart({ data }: RiskAssessmentChartProps) {
  const chartData = {
    labels: data.categories.map(cat => cat.name),
    datasets: [
      {
        label: 'Risk Score',
        data: data.categories.map(cat => cat.riskScore),
        backgroundColor: data.categories.map(cat => {
          const percentage = (cat.riskScore / cat.maxScore) * 100;
          if (percentage < 30) return 'rgba(34, 197, 94, 0.8)'; // Green - Low risk
          if (percentage < 70) return 'rgba(251, 191, 36, 0.8)'; // Yellow - Medium risk
          return 'rgba(239, 68, 68, 0.8)'; // Red - High risk
        }),
        borderColor: data.categories.map(cat => {
          const percentage = (cat.riskScore / cat.maxScore) * 100;
          if (percentage < 30) return 'rgba(34, 197, 94, 1)';
          if (percentage < 70) return 'rgba(251, 191, 36, 1)';
          return 'rgba(239, 68, 68, 1)';
        }),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Risk Assessment by Category',
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const maxScore = data.categories[context.dataIndex].maxScore;
            const percentage = ((value / maxScore) * 100).toFixed(1);
            return `Risk Score: ${value}/${maxScore} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...data.categories.map(cat => cat.maxScore)),
        title: {
          display: true,
          text: 'Risk Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Risk Categories'
        }
      }
    },
  };

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}