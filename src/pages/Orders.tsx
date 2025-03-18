import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  orderSummary: OrderSummary;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ensure orders is always an array
        if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          console.error('Expected array of orders but got:', typeof response.data);
          setOrders([]); // Set to empty array if response is not an array
          toast.error('Invalid order data format');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        setOrders([]); // Ensure orders is at least an empty array
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, token]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancellingOrder(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the orders list with the cancelled order
      setOrders(prev => 
        prev.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: 'cancelled' } 
            : order
        )
      );

      // Update the selected order if it's the one being cancelled
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: 'cancelled' });
      }

      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      let errorMessage = 'Failed to cancel order';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setCancellingOrder(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-medium text-gray-800 mb-4">Please login to view your orders</h2>
          <Link to="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-medium text-gray-800 mb-4">No orders found</h2>
          <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Order History</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.items.length} item(s)</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            <span className="ml-1 capitalize">{order.orderStatus}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                            <span className="capitalize">{order.paymentStatus}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.orderSummary.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Order Details */}
          {selectedOrder && (
            <div className="lg:col-span-3 mt-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Order Information</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date Placed:</span> {formatDate(selectedOrder.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Order Status:</span>{' '}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                          {getStatusIcon(selectedOrder.orderStatus)}
                          <span className="ml-1 capitalize">{selectedOrder.orderStatus}</span>
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Payment Status:</span>{' '}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.paymentStatus)}`}>
                          <span className="capitalize">{selectedOrder.paymentStatus}</span>
                        </span>
                      </p>
                      {selectedOrder.trackingNumber && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Tracking Number:</span> {selectedOrder.trackingNumber}
                        </p>
                      )}
                      {selectedOrder.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Estimated Delivery:</span> {formatDate(selectedOrder.estimatedDelivery)}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Shipping Information</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.fullName}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.address}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.state} {selectedOrder.shippingInfo.postalCode}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.country}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.phone}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedOrder.shippingInfo.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Order Items</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-md object-cover" src={item.image} alt={item.name} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {item.size && `Size: ${item.size}`}
                                      {item.size && item.color && ' | '}
                                      {item.color && `Color: ${item.color}`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{item.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Order Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-medium">₹{selectedOrder.orderSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Shipping</span>
                        <span className="text-sm font-medium">
                          {selectedOrder.orderSummary.shipping === 0 ? 'Free' : `₹${selectedOrder.orderSummary.shipping.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Tax</span>
                        <span className="text-sm font-medium">₹{selectedOrder.orderSummary.tax.toFixed(2)}</span>
                      </div>
                      {selectedOrder.orderSummary.discount > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-sm text-gray-600">Discount</span>
                          <span className="text-sm font-medium text-green-600">-₹{selectedOrder.orderSummary.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-t mt-2 pt-2">
                        <span className="text-base font-medium">Total</span>
                        <span className="text-base font-medium">₹{selectedOrder.orderSummary.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Link to="/products" className="text-blue-600 hover:text-blue-800">
                      Continue Shopping
                    </Link>
                    {selectedOrder.orderStatus === 'processing' && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder._id)}
                        disabled={cancellingOrder}
                        className={`text-red-600 hover:text-red-800 ${cancellingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;