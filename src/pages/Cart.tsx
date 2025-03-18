import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  const getProductData = (item: any) => {
    const isPopulated = typeof item.productId === 'object' && item.productId !== null;
    
    // For populated items, price may be in productId.price, not in item.price
    let price: number;
    if (isPopulated && typeof item.productId.price === 'number') {
      price = item.productId.price;
    } else if (typeof item.price === 'number') {
      price = item.price;
    } else {
      price = 0;
    }
    
    const name = isPopulated ? item.productId.name : item.name;
    const image = isPopulated && item.productId.images ? item.productId.images[0] : item.image;
    const id = isPopulated ? item.productId._id : item.productId;

    // Ensure we have valid values
    return {
      id: id || '',
      name: name || 'Unknown Product',
      price: price,
      image: image || ''
    };
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      console.log('Attempting to remove item with ID:', itemId);
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    // In a real app, you would validate the coupon with your backend
    if (couponCode.toUpperCase() === 'SUMMER25') {
      const discountAmount = cart.totalPrice * 0.25;
      setDiscount(discountAmount);
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to continue to checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-medium text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = cart.totalPrice || 0;
  const shippingCost = totalPrice >= 50 ? 0 : 5;
  const finalTotal = totalPrice - discount + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flow-root">
                <ul className="-my-6 divide-y divide-gray-200">
                  {cart.items.map((item) => {
                    const product = getProductData(item);
                    return (
                      <li key={item._id} className="py-6 flex">
                        <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-800">
                              <h3>
                                <Link to={`/product/${product.id}`} className="hover:text-blue-600">
                                  {product.name}
                                </Link>
                              </h3>
                              <p className="ml-4">₹{(product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              ₹{product.price.toFixed(2)} each
                            </p>
                            {item.size && (
                              <p className="mt-1 text-sm text-gray-600">
                                Size: {item.size}
                              </p>
                            )}
                            {item.color && (
                              <p className="mt-1 text-sm text-gray-600">
                                Color: {item.color}
                              </p>
                            )}
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                className="p-2 hover:bg-gray-100"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4 text-gray-600" />
                              </button>
                              <span className="px-4 py-2 text-gray-800">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                className="p-2 hover:bg-gray-100"
                              >
                                <Plus className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item._id)}
                              className="text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Continue Shopping */}
          <div className="mt-6">
            <Link to="/products" className="text-blue-600 hover:text-blue-800 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            
            <dl className="-my-4 text-sm divide-y divide-gray-200">
              <div className="py-4 flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-800">₹{totalPrice.toFixed(2)}</dd>
              </div>
              
              {discount > 0 && (
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Discount</dt>
                  <dd className="font-medium text-green-600">-₹{discount.toFixed(2)}</dd>
                </div>
              )}
              
              <div className="py-4 flex items-center justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium text-gray-800">
                  {totalPrice >= 50 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    '₹5.00'
                  )}
                </dd>
              </div>
              
              <div className="py-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-800">Order Total</dt>
                <dd className="text-base font-medium text-gray-800">
                  ₹{finalTotal.toFixed(2)}
                </dd>
              </div>
            </dl>
            
            {/* Coupon Code */}
            <div className="mt-6">
              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="coupon"
                  name="coupon"
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
            
            {/* Checkout Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCheckout}
                className="btn-primary w-full py-3"
              >
                Proceed to Checkout
              </button>
            </div>
            
            {/* Payment Methods */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">We accept:</p>
              <div className="flex space-x-2">
                <img src="https://framerusercontent.com/images/apE2tIqb1SpkFBcRkZky8sCio.gif" alt="Razorpay" className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;