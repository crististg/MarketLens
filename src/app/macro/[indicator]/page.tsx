// src/app/macro/[indicator]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import CrosshairPlugin from 'chartjs-plugin-crosshair'; // Import the plugin
import { ArrowDown, ArrowUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CrosshairPlugin // Register the CrosshairPlugin
);

interface MacroDataPoint {
  date: string;
  value: number;
}

interface MacroApiResponse {
  live: {
    date: string;
    value: number;
    unit: string;
  };
  historical: MacroDataPoint[];
  unit: string;
}

const MacroDetailPage = () => {
  const params = useParams();
  const indicator = params.indicator as string; // e.g., "CPI", "GDP"

  const [macroData, setMacroData] = useState<MacroApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMacroData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/macro?indicator=${indicator}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch data for ${indicator}`);
        }
        const data: MacroApiResponse = await response.json();
        console.log("Macro Data received:", data); // Add this line for debugging
        setMacroData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (indicator) {
      fetchMacroData();
    }
  }, [indicator]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-neutral-400">Loading {indicator} data...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-red-500">Error: {error}</p>
        </div>
    );
  }

  if (!macroData) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-neutral-400">No data available for {indicator}.</p>
        </div>
    );
  }

  // Calculate change and change_percent for summary
  let change: number | undefined;
  let change_percent: number | undefined;

  const latestValue = macroData.historical[0]?.value;
  const previousValue = macroData.historical[1]?.value;

  if (latestValue !== undefined && previousValue !== undefined) {
    change = latestValue - previousValue;
    change_percent = (change / previousValue) * 100;
  }

  const changeType = change !== undefined && change >= 0 ? 'positive' : 'negative';
  const ChangeIcon = change !== undefined && change >= 0 ? ArrowUp : ArrowDown;

  // Prepare chart data (reverse for chronological order)
  const chartDataPoints = macroData.historical.slice().reverse(); // Create a copy before reversing

  const data = {
    labels: chartDataPoints.map(d => format(parseISO(d.date), 'MMM yyyy')),
    datasets: [
      {
        label: `${indicator} Value`,
        data: chartDataPoints.map(d => d.value),
        borderColor: '#22D3EE', // market-accent-positive
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0, // Hide points
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
              labels: {
                color: 'white',
              },
            },
            title: {
              display: true,
              text: `${indicator} (${macroData.live.value.toFixed(2)}${macroData.unit} on ${format(parseISO(macroData.live.date), 'MMM dd, yyyy')})`, // Dynamic title
              color: 'white',
              font: {
                  size: 16
              }
            },
            tooltip: {
              callbacks: {
                title: function(context: any) {
                    // Return the date for the title
                    return context[0].label;
                },
                label: function(context: any) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += `${context.parsed.y.toFixed(2)}${macroData.unit}`;
                  }
                  return label;
                },
              }
            },      crosshair: { // Crosshair plugin configuration
          line: {
              color: '#F66B0E', // Example color
              width: 1
          },
          sync: {
              enabled: true,
              group: 1,
              subsetOfElements: false, // Sync all elements
          },
          zoom: {
              enabled: false,
          },
          snap: {
              enabled: true // Snap to data points
          }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#333',
        },
        ticks: {
          color: 'white',
        },
        title: {
            display: true,
            text: 'Date',
            color: 'white'
        }
      },
      y: {
        grid: {
          color: '#333',
        },
        ticks: {
          color: 'white',
          callback: function(value: string | number) {
            return `${value}${macroData.unit || ''}`;
          },
        },
        beginAtZero: false,
        title: {
            display: true,
            text: 'Value',
            color: 'white'
        }
      },
    },
  };


  return (
    <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-market-primary">{indicator} Overview</h1>

        {/* Macro Summary */}
        <div className="bg-neutral-900 p-6 rounded-lg mb-6 border border-neutral-800">
          <h2 className="text-xl font-bold mb-4 text-white">{indicator} Summary</h2>
          <div className="grid grid-cols-2 gap-4"> {/* Simplified grid */}
            <div>
              <p className="text-neutral-400 text-sm">Current Value</p>
              <p className={`text-2xl font-semibold ${change !== undefined && change >= 0 ? 'text-market-accent-positive' : 'text-market-accent-negative'}`}>
                {macroData.live.value.toFixed(2)}{macroData.unit}
              </p>
            </div>
            {change !== undefined && change_percent !== undefined && (
              <div>
                <p className="text-neutral-400 text-sm">Change</p>
                <div className={`text-xl font-semibold flex items-center`} style={{ color: changeType === 'positive' ? '#28a745' : '#dc3545' }}>
                  <ChangeIcon size={18} className="mr-1" />
                  {change.toFixed(2)} ({change_percent.toFixed(2)}%)
                </div>
              </div>
            )}
            <div>
              <p className="text-neutral-400 text-sm">Last Updated</p>
              <p className="text-white text-xl">{format(parseISO(macroData.live.date), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Macro Chart */}
        <div className="bg-neutral-900 p-6 rounded-lg mb-6 border border-neutral-800">
            {loading && <p className="text-neutral-400">Loading chart data...</p>}
            {error && <p className="text-red-500">Error loading chart: {error}</p>}
            {!loading && macroData.historical.length > 0 && (
                <Line options={options} data={data} />
            )}
            {!loading && macroData.historical.length === 0 && !error && (
                <p className="text-neutral-400">No chart data available for {indicator}.</p>
            )}
        </div>
      </div>
  );
};

export default MacroDetailPage;