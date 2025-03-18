import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchAllPurchases } from '../services/firebaseService';
import { format, subDays, isSameDay } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = ({ days = 30 }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const purchases = await fetchAllPurchases();
        
        // Generate date labels for the chart (last N days)
        const endDate = new Date();
        const dateLabels = [];
        const dailyData = {
          total: [],
          tests: [],
          interviews: []
        };
        
        // Create dates array and initialize revenue data
        for (let i = days - 1; i >= 0; i--) {
          const date = subDays(endDate, i);
          dateLabels.push(format(date, 'MMM dd'));
          
          // Initialize with zeros
          dailyData.total.push(0);
          dailyData.tests.push(0);
          dailyData.interviews.push(0);
        }
        
        // Process purchase data
        purchases.forEach(purchase => {
          if (!purchase.purchaseDate) return;
          
          const purchaseDate = purchase.purchaseDate.toDate();
          const daysAgo = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24));
          
          // Only consider purchases within our date range
          if (daysAgo >= 0 && daysAgo < days) {
            const amount = purchase.amount / 100; // Convert paise to rupees
            dailyData.total[days - 1 - daysAgo] += amount;
            
            if (purchase.type === 'test') {
              dailyData.tests[days - 1 - daysAgo] += amount;
            } else if (purchase.type === 'interview') {
              dailyData.interviews[days - 1 - daysAgo] += amount;
            }
          }
        });
        
        // Update chart data
        setChartData({
          labels: dateLabels,
          datasets: [
            {
              label: 'Total Revenue',
              data: dailyData.total,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              tension: 0.4
            },
            {
              label: 'Test Revenue',
              data: dailyData.tests,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              tension: 0.4
            },
            {
              label: 'Interview Revenue',
              data: dailyData.interviews,
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.5)',
              tension: 0.4
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [days]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <Line options={options} data={chartData} />;
};

export default RevenueChart; 