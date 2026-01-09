import './KpiCards.css';

interface KpiCardsProps {
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  locale?: string;
  currency?: string;
}

export default function KpiCards({
  totalOrders,
  totalRevenue,
  lowStockCount,
  locale = 'en-IN',
  currency = 'INR',
}: KpiCardsProps) {
  // Handle edge cases for number formatting
  const safeTotalOrders = typeof totalOrders === 'number' && !isNaN(totalOrders) ? totalOrders : 0;
  const safeTotalRevenue = typeof totalRevenue === 'number' && !isNaN(totalRevenue) ? totalRevenue : 0;
  const safeLowStockCount = typeof lowStockCount === 'number' && !isNaN(lowStockCount) ? lowStockCount : 0;

  let formattedRevenue: string;
  try {
    formattedRevenue = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(safeTotalRevenue);
  } catch (error) {
    console.warn('Error formatting currency:', error);
    formattedRevenue = `₹${safeTotalRevenue.toLocaleString()}`;
  }

  const isLowStockCritical = safeLowStockCount > 10;
  const isLowStockWarning = safeLowStockCount > 0 && safeLowStockCount <= 10;

  return (
    <div className="kpi-cards-container" role="region" aria-label="Key Performance Indicators">
      <div className="kpi-card">
        <p>Total Orders</p>
        <h2>{safeTotalOrders.toLocaleString()}</h2>
      </div>
      <div className="kpi-card">
        <p>Total Revenue</p>
        <h2>{formattedRevenue}</h2>
      </div>
      <div className={`kpi-card ${isLowStockCritical ? 'kpi-card-critical' : isLowStockWarning ? 'kpi-card-warning' : ''}`}>
        <p>
          Low Stock
          {safeLowStockCount > 0 && (
            <span className="sr-only"> (Warning: {safeLowStockCount} items below minimum stock level)</span>
          )}
        </p>
        <h2>{safeLowStockCount}</h2>
      </div>
    </div>
  );
}
