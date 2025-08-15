/**
 * Chart utility functions for the admin dashboard
 */

// Chart instance reference
let prizeChart = null;

// Color palette for the chart
const chartColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
  '#06B6D4'  // cyan-500
];

/**
 * Creates a gradient for the chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color - Base color for the gradient
 * @returns {CanvasGradient} - Gradient object
 */
const createGradient = (ctx, color) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `${color}FF`);
  gradient.addColorStop(1, `${color}80`);
  return gradient;
};

/**
 * Initializes the prize distribution chart
 * @param {HTMLElement} canvas - The canvas element
 * @param {Array} data - Chart data
 * @returns {Chart} - Chart.js instance
 */
export const initPrizeChart = (canvas, data) => {
  // Destroy existing chart if it exists
  if (prizeChart) {
    try {
      prizeChart.destroy();
    } catch (error) {
      console.warn('Error destroying existing chart:', error);
    }
  }

  const ctx = canvas.getContext('2d');
  
  // Prepare data for the chart
  const labels = data.map(item => item[0]);
  const values = data.map(item => item[1]);
  const backgroundColors = [];
  const borderColors = [];

  // Create gradients for each segment
  for (let i = 0; i < labels.length; i++) {
    const color = chartColors[i % chartColors.length];
    backgroundColors.push(createGradient(ctx, color));
    borderColors.push(color);
  }

  // Create new chart instance
  prizeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        hoverOffset: 10,
        borderRadius: 4,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              family: '"Inter", sans-serif',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          titleFont: {
            family: '"Inter", sans-serif',
            size: 12,
            weight: '600'
          },
          bodyFont: {
            family: '"Inter", sans-serif',
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: 10
      }
    }
  });

  return prizeChart;
};

/**
 * Updates the chart with new data
 * @param {Array} data - New chart data
 */
export const updateChartData = (data) => {
  if (!prizeChart) return;

  const labels = data.map(item => item[0]);
  const values = data.map(item => item[1]);

  prizeChart.data.labels = labels;
  prizeChart.data.datasets[0].data = values;
  
  // Update colors if the number of data points changes
  if (values.length !== prizeChart.data.datasets[0].backgroundColor.length) {
    const ctx = prizeChart.ctx;
    prizeChart.data.datasets[0].backgroundColor = labels.map((_, i) => 
      createGradient(ctx, chartColors[i % chartColors.length])
    );
    prizeChart.data.datasets[0].borderColor = labels.map((_, i) => 
      chartColors[i % chartColors.length]
    );
  }

  prizeChart.update();
};

/**
 * Destroys the chart instance
 */
export const destroyChart = () => {
  if (prizeChart) {
    try {
      prizeChart.destroy();
    } catch (error) {
      console.warn('Error destroying chart:', error);
    } finally {
      prizeChart = null;
    }
  }
};

export default {
  initPrizeChart,
  updateChartData,
  destroyChart
};
