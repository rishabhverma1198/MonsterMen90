// Import CSS styles
import './OrdersTable.css';

// Enhanced TypeScript interfaces with better type safety
interface Order {
  id: string | number;
  total_amount: number;
  created_at: string | Date;
  // Optional additional fields that might be added later
  customer_name?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  error?: string | null;
}

export default function OrdersTable({ orders, isLoading = false, error = null }: OrdersTableProps) {
  // Enhanced helper function to safely format date with better error handling
  const formatDate = (dateInput: string | Date | null | undefined): string => {
    // Handle null, undefined, or empty inputs
    if (!dateInput) {
      return 'N/A';
    }

    try {
      const date = new Date(dateInput);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date received:', dateInput);
        return 'Invalid Date';
      }

      // Check if date is unreasonably far in the future or past
      const now = new Date();
      const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
      const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
      
      if (date < hundredYearsAgo || date > hundredYearsFromNow) {
        console.warn('Date out of reasonable range:', dateInput);
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateInput);
      return 'Error';
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Amount</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="empty-state loading">
                <span className="empty-state-icon">⏳</span>
                <div>Loading orders...</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Amount</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="empty-state error">
                <span className="empty-state-icon">⚠️</span>
                <div>Error loading orders</div>
                <div className="empty-state-description">{error}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Handle empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Amount</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="empty-state">
                <span className="empty-state-icon">📋</span>
                <div>No orders found</div>
                <div className="empty-state-description">
                  Orders will appear here once customers make purchases
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Validate orders data
  const validOrders = orders.filter(order =>
    order &&
    (typeof order.id === 'string' || typeof order.id === 'number') &&
    typeof order.total_amount === 'number' &&
    order.created_at
  );

  if (validOrders.length === 0 && orders.length > 0) {
    return (
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Amount</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="empty-state error">
                <span className="empty-state-icon">⚠️</span>
                <div>Invalid order data</div>
                <div className="empty-state-description">No valid orders to display</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="orders-table-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Amount</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {validOrders.map((order: Order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td className="amount">
                {typeof order.total_amount === 'number' && !isNaN(order.total_amount)
                  ? `₹${order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : 'N/A'
                }
              </td>
              <td>{formatDate(order.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}