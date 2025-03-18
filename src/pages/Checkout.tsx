import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNow;

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay');
  const [loading, setLoading] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Calculate order summary
    const items = buyNowItem ? [buyNowItem] : cart.items;
    const subtotal = buyNowItem 
      ? buyNowItem.price * buyNowItem.quantity 
      : cart.totalPrice;
    
    const shipping = subtotal >= 50 ? 0 : 5;
    const tax = subtotal * 0.05; // 5% tax
    
    setOrderSummary({
      subtotal,
      shipping,
      tax,
      discount,
      total: subtotal + shipping + tax - discount,
    });
  }, [user, cart, buyNowItem, discount, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    // In a real app, you would validate the coupon with your backend
    if (couponCode.toUpperCase() === 'SUMMER25') {
      const discountAmount = orderSummary.subtotal * 0.25;
      setDiscount(discountAmount);
      
      // Update order summary with discount
      setOrderSummary((prev) => ({
        ...prev,
        discount: discountAmount,
        total: prev.subtotal + prev.shipping + prev.tax - discountAmount,
      }));
      
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country'
    ];
    
    for (const field of requiredFields) {
      if (!shippingInfo[field as keyof ShippingInfo]) {
        toast.error(`Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(shippingInfo.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Format cart items to match the server's expected format
      const formattedItems = (buyNowItem ? [buyNowItem] : cart.items).map(item => {
        // Handle different possible structures of cart items
        const { imageSource, price, name, brand } = getProductData(item);
        
        // Extract productId correctly
        let productId = item._id;
        if (typeof item.productId === 'object' && item.productId?._id) {
          productId = item.productId._id;
        } else if (typeof item.productId === 'string') {
          productId = item.productId;
        }
        
        return {
          productId: productId,
          name: name,
          price: price,
          image: imageSource,
          quantity: item.quantity || 1,
          size: item.size || '',
          color: item.color || ''
        };
      });
      
      // Create order in the backend
      const orderData = {
        items: formattedItems,
        shippingInfo,
        paymentMethod,
        orderSummary,
      };
      
      console.log('Sending order data:', JSON.stringify(orderData));
      
      const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { orderId, amount } = response.data;
      
      // Initialize Razorpay payment
      if (paymentMethod === 'razorpay') {
        initializeRazorpayPayment(orderId, amount);
      } else {
        // Handle other payment methods if needed
        toast.success('Order placed successfully!');
        if (!buyNowItem) {
          await clearCart();
        }
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to place order';
        toast.error(errorMessage);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpayPayment = (orderId: string, amount: number) => {
    // In a real implementation, you would get this from your backend
    const options = {
      key: 'rzp_test_YOUR_KEY_ID', // Replace with your Razorpay key
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Trendy Fashion',
      description: 'Payment for your order',
      order_id: orderId,
      handler: function(response: any) {
        // Handle successful payment
        verifyPayment(response, orderId);
      },
      prefill: {
        name: shippingInfo.fullName,
        email: shippingInfo.email,
        contact: shippingInfo.phone,
      },
      theme: {
        color: '#3b82f6',
      },
    };

    // For demo purposes, show toast that we're simulating payment
    toast.success('Simulating payment (demo mode)...');
    
    // For demo purposes, we'll simulate a successful payment after a short delay
    setTimeout(() => {
      toast.success('Payment simulation completed');
      verifyPayment({ 
        razorpay_payment_id: 'pay_' + Math.random().toString(36).substr(2, 9),
        razorpay_order_id: orderId,
        razorpay_signature: 'signature_' + Math.random().toString(36).substr(2, 9)
      }, orderId);
    }, 2000);
  };

  const verifyPayment = async (paymentResponse: any, orderId: string) => {
    try {
      console.log('Verifying payment for order:', orderId);
      console.log('Payment response:', paymentResponse);
      
      // For COD orders, just navigate to success
      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully! You will pay on delivery.');
        if (!buyNowItem) {
          await clearCart();
        }
        navigate('/orders');
        return;
      }
      
      // For Razorpay demo mode
      toast.loading('Verifying payment...');
      
      // Verify payment with backend
      const response = await axios.post(`${API_BASE_URL}/api/payments/verify`, {
        orderId,
        paymentId: paymentResponse.razorpay_payment_id,
        signature: paymentResponse.razorpay_signature,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Payment verification response:', response.data);
      toast.dismiss();
      toast.success('Payment successful! Your order has been placed.');
      
      if (!buyNowItem) {
        try {
          await clearCart();
        } catch (cartError) {
          console.error('Error clearing cart:', cartError);
          // Continue even if cart clearing fails
        }
      }
      
      // Navigate to orders page after successful payment
      navigate('/orders');
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast.dismiss();
      
      // Show appropriate error message
      if (axios.isAxiosError(error)) {
        // Check if it's a 404 - order not found
        if (error.response?.status === 404) {
          toast.error('Order not found. Please try again.');
        } else {
          const errorMessage = error.response?.data?.message || 'Payment verification failed';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
      
      // Navigate to orders page anyway - the order was created
      navigate('/orders');
    }
  };

  // Add a helper function to extract product data
  const getProductData = (item: any) => {
    // Handle image source
    let imageSource = '';
    if (item.images && item.images.length > 0) {
      imageSource = item.images[0];
    } else if (item.image) {
      imageSource = item.image;
    } else if (typeof item.productId === 'object' && item.productId !== null) {
      // If productId is an object (populated), get images from there
      if (item.productId.images && item.productId.images.length > 0) {
        imageSource = item.productId.images[0];
      }
    }
    
    // Handle price
    let price = 0;
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (typeof item.price === 'string') {
      price = parseFloat(item.price) || 0;
    } else if (typeof item.productId === 'object' && item.productId !== null) {
      // If productId is populated, use its price
      if (typeof item.productId.price === 'number') {
        price = item.productId.price;
      } else if (typeof item.productId.price === 'string') {
        price = parseFloat(item.productId.price) || 0;
      }
    }
    
    // Handle product name
    let name = item.name || '';
    if (!name && typeof item.productId === 'object' && item.productId !== null) {
      name = item.productId.name || '';
    }
    
    // Handle brand
    let brand = item.brand || '';
    if (!brand && typeof item.productId === 'object' && item.productId !== null) {
      brand = item.productId.brand || '';
    }
    
    return { imageSource, price, name, brand };
  };

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="input-field"
                  value={shippingInfo.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="input-field"
                  value={shippingInfo.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="input-field"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="input-field"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  className="input-field"
                  value={shippingInfo.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  className="input-field"
                  value={shippingInfo.postalCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  className="input-field"
                  value={shippingInfo.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="razorpay"
                  name="paymentMethod"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                />
                <label htmlFor="razorpay" className="ml-3 block text-sm font-medium text-gray-700">
                  Razorpay (Credit/Debit Card, UPI, Netbanking)
                </label>
                <img src="https://cdn.razorpay.com/static/assets/logo/payment-powered-by-razorpay.svg" alt="Razorpay" className="h-6 ml-auto" />
              </div>
              
              <div className="flex items-center">
                <input
                  id="cod"
                  name="paymentMethod"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                  Cash on Delivery (COD)
                </label>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                Your payment information is processed securely. We do not store credit card details nor have access to your credit card information.
              </p>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            
            {/* Order Items */}
            <div className="flow-root mb-6">
              <ul className="-my-4 divide-y divide-gray-200">
                {(buyNowItem ? [buyNowItem] : cart.items).map((item) => {
                  const { imageSource, price, name, brand } = getProductData(item);
                  return (
                    <li key={item._id} className="py-4 flex">
                      <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={imageSource}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between text-sm font-medium">
                          <h3 className="text-gray-800 font-semibold">{name}</h3>
                          <p className="text-gray-800 font-bold">₹{(price * item.quantity).toLocaleString()}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            Qty: {item.quantity}
                          </span>
                          {item.size && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        {brand && (
                          <p className="mt-1 text-xs text-gray-500">{brand}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Coupon Code */}
            <div className="mb-6">
              <label htmlFor="checkout-coupon" className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="checkout-coupon"
                  name="checkout-coupon"
                  className="input-field rounded-r-none"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-r-md transition duration-300"
                >
                  Apply
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Try "SUMMER25" for 25% off</p>
            </div>
            
            {/* Price Details */}
            <div className="flow-root">
              <dl className="-my-4 text-sm divide-y divide-gray-200">
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-800">₹{(parseFloat(orderSummary.subtotal) || 0).toLocaleString()}</dd>
                </div>
                
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium text-gray-800">
                    {orderSummary.shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${(parseFloat(orderSummary.shipping) || 0).toLocaleString()}`
                    )}
                  </dd>
                </div>
                
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Tax (5%)</dt>
                  <dd className="font-medium text-gray-800">₹{(parseFloat(orderSummary.tax) || 0).toLocaleString()}</dd>
                </div>
                
                {orderSummary.discount > 0 && (
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">Discount</dt>
                    <dd className="font-medium text-green-600">-₹{(parseFloat(orderSummary.discount) || 0).toLocaleString()}</dd>
                  </div>
                )}
                
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-800">Order Total</dt>
                  <dd className="text-base font-medium text-gray-800">
                  ₹{(parseFloat(orderSummary.total) || 0).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Place Order Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="btn-primary w-full py-3"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
            
            {/* Back to Cart */}
            <div className="mt-4 text-center">
              <Link to="/cart" className="text-sm text-blue-600 hover:text-blue-800">
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;