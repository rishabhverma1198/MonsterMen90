import './SalesChart.css';

interface SalesData {
  date: string;
  revenue: number;
}

interface SalesChartProps {
  data: SalesData[];
}

export default function SalesChart({ data }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="sales-chart">
        <h3 className="sales-chart__title">Daily Revenue</h3>
        <p className="sales-chart__no-data" role="status" aria-live="polite">
          No analytics data available
        </p>
      </div>
    );
  }

  // Filter out invalid data and handle edge cases
  const validData = data.filter(d =>
    d &&
    typeof d.revenue === 'number' &&
    !isNaN(d.revenue) &&
    d.date
  );

  if (validData.length === 0) {
    return (
      <div className="sales-chart">
        <h3 className="sales-chart__title">Daily Revenue</h3>
        <p className="sales-chart__no-data" role="status" aria-live="polite">
          No valid revenue data found
        </p>
      </div>
    );
  }

  // Handle edge case where all revenues are the same
  const revenues = validData.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues);
  const minRevenue = Math.min(...revenues);
  
  // Handle case where all values are the same or invalid range
  const revenueRange = maxRevenue - minRevenue || 1;
  const chartHeight = 160;
  const chartBottom = 200;

  // Calculate chart dimensions based on data
  const chartWidth = Math.max(300, validData.length * 40);
  const barWidth = Math.max(20, Math.floor((chartWidth - 40) / validData.length));

  return (
    <div className="sales-chart">
      <h3 className="sales-chart__title">Daily Revenue</h3>
      
      <div className="sales-chart__container" role="img" aria-label="Bar chart showing daily revenue data">
        <svg
          className="sales-chart__svg"
          viewBox={`0 0 ${chartWidth} 220`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {validData.map((d, index) => {
            // Calculate normalized height with better scaling
            const normalizedHeight = Math.abs((d.revenue - minRevenue) / revenueRange) * chartHeight;
            const height = Math.max(normalizedHeight, 4); // Minimum height for visibility
            const x = 20 + index * (chartWidth / validData.length);
            const y = d.revenue >= 0 ? chartBottom - height : chartBottom;
            const isNegative = d.revenue < 0;
            
            return (
              <g key={`${d.date}-${index}`}>
                <rect
                  className={`sales-chart__bar ${isNegative ? 'sales-chart__bar--negative' : ''}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  role="presentation"
                >
                  <title>{`${d.date}: ₹${d.revenue.toLocaleString()}`}</title>
                </rect>
                {/* Add date labels for smaller datasets */}
                {validData.length <= 15 && (
                  <text
                    x={x + barWidth / 2}
                    y={210}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                  >
                    {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Screen reader only summary */}
      <div className="sr-only" aria-live="polite">
        {`Chart shows ${validData.length} data points. `}
        {`Highest revenue: ₹${maxRevenue.toLocaleString()}. `}
        {`Lowest revenue: ₹${minRevenue.toLocaleString()}. `}
        {minRevenue < 0 && 'Some values are negative.'}
      </div>
    </div>
  );
}