import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

interface CartItem {
  _id: string;
  productId: string | Product;  // Can be either string ID or populated Product object
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Define proper types for API responses
interface ApiErrorResponse {
  message?: string;
  [key: string]: unknown;
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  images: string[];
  [key: string]: unknown; // For other possible product properties
}

interface CartContextType {
  cart: Cart;
  loading: boolean;
  error: string | null;
  addToCart: (product: ProductData, quantity: number, size?: string, color?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<Cart>({ items: [], totalItems: 0, totalPrice: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localCartMerged, setLocalCartMerged] = useState<boolean>(false);
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

  // Reset merge state when user logs in after logout
  useEffect(() => {
    if (user && token && localStorage.getItem('userLoggedOut') === 'true') {
      console.log('Resetting localCartMerged because user logged in after previous logout');
      setLocalCartMerged(false);
      localStorage.removeItem('userLoggedOut');
    }
  }, [user, token]);

  // Calculate cart totals
  const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    
    const totalPrice = items.reduce((total, item) => {
      // Handle price that could be in either item.price or item.productId.price
      let itemPrice: number;
      if (typeof item.productId === 'object' && item.productId !== null && typeof item.productId.price === 'number') {
        // If productId is populated, use its price
        itemPrice = item.productId.price;
      } else if (typeof item.price === 'number') {
        // Otherwise use the item's own price
        itemPrice = item.price;
      } else {
        // Default to 0 if no valid price found
        itemPrice = 0;
      }
      
      return total + (itemPrice * item.quantity);
    }, 0);
    
    return { items, totalItems, totalPrice };
  };

  // Persist cart to localStorage (extracted as a separate function for reuse)
  const persistCartToLocalStorage = useCallback((cartData: Cart) => {
    if (cartData && cartData.items) {
      console.log('Persisting cart to localStorage:', cartData.items.length, 'items');
      localStorage.setItem('cart', JSON.stringify(cartData));
    }
  }, []);

  // Load cart from localStorage (extracted as a separate function for reuse)
  const loadCartFromLocalStorage = useCallback((): Cart | null => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart) as Cart;
        console.log('Loaded cart from localStorage:', parsedCart.items.length, 'items');
        return parsedCart;
      }
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
    }
    return null;
  }, []);

  // Merge local cart with server cart
  const mergeLocalCartWithServer = async () => {
    // Get cart from localStorage
    const storedCart = localStorage.getItem('cart');
    
    // Only merge if there's a stored cart, user is logged in, and we haven't merged yet
    if (storedCart && user && token && !localCartMerged) {
      try {
        setLoading(true);
        console.log('Starting local cart merge with server');
        const parsedCart = JSON.parse(storedCart) as Cart;
        
        if (parsedCart.items.length > 0) {
          toast.success('Restoring your cart items from your previous session');
          console.log('Found', parsedCart.items.length, 'items in local cart to merge');
          
          // First, fetch the current server cart to avoid duplicates
          const serverCartResponse = await axios.get(`${API_BASE_URL}/api/cart`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const serverCartItems = serverCartResponse.data?.items || [];
          const serverProductIds = new Set(serverCartItems.map(item => 
            typeof item.productId === 'object' ? item.productId._id : item.productId
          ));
          
          // Keep track of successful merges
          let successfulMerges = 0;
          
          // Add each local cart item to server cart, skipping duplicates
          for (const item of parsedCart.items) {
            try {
              // Skip items that don't have productId or are already in server cart
              const productId = typeof item.productId === 'object' ? item.productId._id : item.productId;
              
              if (!productId) {
                console.log('Skipping item with no productId');
                continue;
              }
              
              if (serverProductIds.has(productId)) {
                console.log('Skipping duplicate item already in server cart:', productId);
                continue;
              }
              
              console.log('Merging item to server:', productId);
              await axios.post(`${API_BASE_URL}/api/cart`, 
                { 
                  productId: productId, 
                  quantity: item.quantity, 
                  size: item.size, 
                  color: item.color 
                }, 
                {
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              successfulMerges++;
            } catch (itemError) {
              console.error('Error adding individual cart item:', itemError);
              // Continue with other items if one fails
            }
          }
          
          console.log('Successfully merged', successfulMerges, 'items to server');
          
          // Always mark as merged regardless of success to prevent repeated attempts
          setLocalCartMerged(true);
          
          // Fetch updated cart from server
          try {
            console.log('Fetching updated cart from server after merge');
            const response = await axios.get(`${API_BASE_URL}/api/cart`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data && response.data.items) {
              const serverCart = calculateTotals(response.data.items);
              console.log('Received', serverCart.items.length, 'items from server after merge');
              
              // Only update cart state if we got items back
              if (serverCart.items.length > 0) {
                setCart(serverCart);
                // Also update localStorage with server's version for consistency
                persistCartToLocalStorage(serverCart);
              } else if (parsedCart.items.length > 0) {
                // If server returned empty but we had local items, keep using local
                console.log('Server returned empty cart, continuing with local cart data');
                setCart(calculateTotals(parsedCart.items));
              }
              
              setInitialLoadDone(true);
            }
          } catch (fetchError) {
            console.error('Error fetching cart after merge:', fetchError);
            // If we can't fetch from server, keep using local cart
            setCart(calculateTotals(parsedCart.items));
            setInitialLoadDone(true);
            toast.error('Server unavailable. Using local cart data.');
          }
        }
      } catch (error) {
        const err = error as AxiosError<ApiErrorResponse>;
        const errorMsg = err.response?.data?.message || 'Failed to merge cart';
        setError(errorMsg);
        console.error('Error merging cart:', err);
        toast.error('Failed to restore your previous cart items');
        // Since merging failed, mark initialLoadDone to use local cart
        setInitialLoadDone(true);
      } finally {
        setLoading(false);
      }
    } else {
      // If we're not merging, still mark as done
      setInitialLoadDone(true);
    }
  };

  // Fetch cart from local storage or API
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      console.log('fetchCart triggered, user:', !!user, 'token:', !!token);
      try {
        // First check if we have items in localStorage regardless of login status
        const localCartData = loadCartFromLocalStorage();
        let localCartLoaded = false;
        
        if (localCartData) {
          // Load local cart initially while we check server
          setCart(calculateTotals(localCartData.items));
          localCartLoaded = true;
          console.log('Initial load from localStorage:', localCartData.items.length, 'items');
        } else {
          console.log('No cart found in localStorage');
        }
        
        if (user && token) {
          console.log('User is logged in, proceeding with server operations');
          // If user just logged in, merge local cart with server cart
          await mergeLocalCartWithServer();
          
          // Fetch cart from API if user is logged in
          if (!localCartMerged) {
            console.log('Fetching cart from server (not merged yet)');
            try {
              const response = await axios.get(`${API_BASE_URL}/api/cart`, {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.data && response.data.items) {
                const serverCart = calculateTotals(response.data.items);
                console.log('Received', serverCart.items.length, 'items from server');
                
                // If server has items, use them
                if (serverCart.items.length > 0) {
                  setCart(serverCart);
                  // Also update localStorage
                  persistCartToLocalStorage(serverCart);
                } else if (localCartData && localCartData.items.length > 0) {
                  // If server returned empty but we had local items, let's merge them to the server
                  console.log('Server returned empty cart, but we have local items to merge');
                  await mergeLocalCartWithServer();
                }
                
                setInitialLoadDone(true);
              } else {
                console.log('Server returned empty cart response');
                // If server returns empty cart but we have local items
                if (localCartData && !localCartMerged) {
                  console.log('Using local cart data over empty server response');
                  setCart(calculateTotals(localCartData.items));
                }
                setInitialLoadDone(true);
              }
            } catch (error) {
              console.error('Error fetching cart from server:', error);
              // If server is down but we have a local cart, use it
              if (localCartLoaded) {
                toast.error('Server unavailable. Showing locally saved cart items.');
              }
              setInitialLoadDone(true);
            }
          }
        } else {
          // Reset merged state when user logs out
          console.log('User not logged in, using localStorage data only');
          setLocalCartMerged(false);
          
          // Get cart from local storage if user is not logged in
          if (localCartLoaded) {
            setInitialLoadDone(true);
          } else {
            // Reset cart if no local cart exists
            setCart({ items: [], totalItems: 0, totalPrice: 0 });
            setInitialLoadDone(true);
          }
        }
      } catch (error) {
        const err = error as AxiosError<ApiErrorResponse>;
        const errorMsg = err.response?.data?.message || 'Failed to fetch cart';
        setError(errorMsg);
        console.error('Error fetching cart:', error);
        
        // If server is down, try to use local cart
        const localCartData = loadCartFromLocalStorage();
        if (localCartData) {
          setCart(calculateTotals(localCartData.items));
          toast.error('Server unavailable. Showing locally saved cart items.');
          setInitialLoadDone(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, token, loadCartFromLocalStorage, persistCartToLocalStorage]);

  // Ensure cart is loaded from localStorage on page refresh
  useEffect(() => {
    // This useEffect ensures cart is loaded from localStorage on page refresh
    if (!initialLoadDone) {
      console.log('Initial load not done yet, checking localStorage for cart data');
      const localCartData = loadCartFromLocalStorage();
      if (localCartData) {
        console.log('Found cart in localStorage during refresh check:', localCartData.items.length, 'items');
        setCart(calculateTotals(localCartData.items));
        setInitialLoadDone(true);
      } else {
        console.log('No cart found in localStorage during refresh check');
      }
    }
  }, [initialLoadDone, loadCartFromLocalStorage]);

  // Save cart to local storage when it changes
  useEffect(() => {
    // Always save cart to localStorage, even for logged in users
    // This ensures cart persistence even when server is unavailable
    if (initialLoadDone) {
      console.log('Cart state changed, items:', cart.items.length);
      if (cart.items.length > 0) {
        console.log('Saving cart to localStorage with', cart.items.length, 'items');
        persistCartToLocalStorage(cart);
      } else if (cart.items.length === 0 && localStorage.getItem('cart')) {
        // Don't clear localStorage if our state is empty but localStorage has items
        // This prevents wiping out the cart during component mounting
        // Only clear if we've explicitly emptied the cart
        const userAction = localStorage.getItem('cartCleared');
        if (userAction === 'true') {
          console.log('Clearing cart in localStorage due to explicit user action');
          localStorage.removeItem('cart');
          localStorage.removeItem('cartCleared');
        } else {
          console.log('Cart state is empty but not clearing localStorage');
          // Load from localStorage to ensure we don't lose items
          const localCartData = loadCartFromLocalStorage();
          if (localCartData && localCartData.items.length > 0) {
            console.log('Restoring cart from localStorage to prevent data loss');
            setCart(calculateTotals(localCartData.items));
          }
        }
      }
    } else {
      console.log('Initial load not complete, skipping cart save to localStorage');
    }
  }, [cart, initialLoadDone, persistCartToLocalStorage, loadCartFromLocalStorage]);

  // Add item to cart
  const addToCart = async (product: ProductData, quantity: number, size?: string, color?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Adding to cart:', product.name, 'quantity:', quantity);
      
      // Ensure we have valid product data
      if (!product || !product._id || !/^[0-9a-fA-F]{24}$/.test(product._id)) {
        throw new Error('Invalid product data or product ID');
      }

      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      const cartItem: CartItem = {
        _id: product._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        quantity,
        size,
        color
      };

      if (user && token) {
        try {
          console.log('User is logged in, adding to server cart');
          // Add to cart in API if user is logged in
          const response = await axios.post(`${API_BASE_URL}/api/cart`, 
            { 
              productId: product._id, 
              quantity: quantity || 1, // Ensure quantity is never undefined
              size: size || null,  // Send null if size is undefined
              color: color || null // Send null if color is undefined
            }, 
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Use the returned cart data directly
          if (response.data && response.data.items) {
            const serverCart = calculateTotals(response.data.items);
            console.log('Server returned updated cart with', serverCart.items.length, 'items');
            setCart(serverCart);
            
            // Also update localStorage with the server's version
            persistCartToLocalStorage(serverCart);
            
            toast.success(`${product.name} added to cart!`);
            return; // Exit early on success
          } else {
            console.log('Server returned empty or invalid cart response');
            // If server didn't return proper cart data, fall back to local
            addToLocalCart(cartItem, quantity);
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // If the server is unavailable, fall back to local storage
          if (axios.isAxiosError(apiError) && (
              apiError.code === 'ERR_NETWORK' || 
              apiError.response?.status === 503 || // Service unavailable
              apiError.response?.status === 502 || // Bad gateway
              apiError.response?.status === 504    // Gateway timeout
             )) {
            console.log('Server unavailable, falling back to local storage');
            toast.error('Server unavailable. Changes saved locally and will sync when connection is restored.');
            // Continue to local storage logic below
            addToLocalCart(cartItem, quantity);
            return;
          } else if (axios.isAxiosError(apiError) && apiError.response?.status === 404) {
            // This is likely just a missing route rather than server unavailability
            console.log('Cart service not found (404)');
            toast.error('Cart service not found. Please try again later.');
            // Continue to local storage logic below
            addToLocalCart(cartItem, quantity);
            return;
          } else {
            const err = apiError as AxiosError<ApiErrorResponse>;
            const errorMsg = err.response?.data?.message || 'Failed to add item to cart';
            setError(errorMsg);
            toast.error(errorMsg);
            throw apiError;
          }
        }
      } else {
        console.log('User not logged in, adding to local cart only');
        addToLocalCart(cartItem, quantity);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      const err = error as AxiosError<ApiErrorResponse>;
      const errorMsg = err.response?.data?.message || (error instanceof Error ? error.message : 'Failed to add item to cart');
      setError(errorMsg);
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add item to local cart
  const addToLocalCart = (cartItem: CartItem, quantity: number) => {
    // Add to local cart if user is not logged in or if server is unavailable
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === cartItem.productId && 
              (item.size === cartItem.size || (!item.size && !cartItem.size)) && 
              (item.color === cartItem.color || (!item.color && !cartItem.color))
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      console.log('Item already exists in cart, updating quantity');
      updatedItems = [...cart.items];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      console.log('Adding new item to cart');
      updatedItems = [...cart.items, cartItem];
    }
    
    const newCart = calculateTotals(updatedItems);
    setCart(newCart);
    
    // Save to localStorage
    persistCartToLocalStorage(newCart);
    
    toast.success(`${cartItem.name} added to cart!`);
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Removing item from cart, ID:', itemId);
      // Validate itemId is properly formatted
      if (!itemId || !/^[0-9a-fA-F]{24}$/.test(itemId)) {
        throw new Error('Invalid item ID format');
      }

      if (user && token) {
        try {
          console.log('User is logged in, removing from server cart');
          // Remove from API cart if user is logged in
          const response = await axios.delete(`${API_BASE_URL}/api/cart/${itemId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data && response.data.items) {
            const serverCart = calculateTotals(response.data.items);
            console.log('Server returned updated cart with', serverCart.items.length, 'items after removal');
            setCart(serverCart);
            
            // Also update localStorage with the server's version
            persistCartToLocalStorage(serverCart);
            
            toast.success('Item removed from cart');
            return; // Exit early on success
          } else {
            console.log('Server returned empty or invalid cart response');
            // If server didn't return proper cart data, fall back to local
            removeFromLocalCart(itemId);
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // If the server is unavailable, fall back to local storage
          if (axios.isAxiosError(apiError) && (
              apiError.code === 'ERR_NETWORK' || 
              apiError.response?.status === 503 || // Service unavailable
              apiError.response?.status === 502 || // Bad gateway
              apiError.response?.status === 504    // Gateway timeout
            )) {
            console.log('Server unavailable, falling back to local storage');
            toast.error('Server unavailable. Changes saved locally and will sync when connection is restored.');
            // Continue to local storage logic below
            removeFromLocalCart(itemId);
            return;
          } else if (axios.isAxiosError(apiError) && apiError.response?.status === 404) {
            // This is likely just a missing route or item not found
            // Continue to local storage logic below without showing an error
            console.log('Item or route not found (404), removing locally');
            removeFromLocalCart(itemId);
            return;
          } else {
            const err = apiError as AxiosError<ApiErrorResponse>;
            const errorMsg = err.response?.data?.message || 'Failed to remove item from cart';
            setError(errorMsg);
            toast.error(errorMsg);
            throw apiError;
          }
        }
      } else {
        console.log('User not logged in, removing from local cart only');
        removeFromLocalCart(itemId);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      const errorMsg = err.response?.data?.message || 'Failed to remove item from cart';
      console.error('Remove from cart error:', error);
      setError(errorMsg);
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to remove item from local cart
  const removeFromLocalCart = (itemId: string) => {
    // Remove from local cart
    console.log('Removing item locally with ID:', itemId);
    
    // Debug log to see what we're trying to filter
    cart.items.forEach(item => {
      console.log('Item in cart:', item._id, typeof item._id);
    });
    
    const updatedItems = cart.items.filter(item => item._id !== itemId);
    
    console.log('Items before:', cart.items.length, 'Items after:', updatedItems.length);
    
    const updatedCart = calculateTotals(updatedItems);
    setCart(updatedCart);
    
    // Save to local storage
    persistCartToLocalStorage(updatedCart);
    
    toast.success('Item removed from cart');
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Updating quantity for item ID:', itemId, 'to:', quantity);
      // Validate itemId is properly formatted
      if (!itemId || !/^[0-9a-fA-F]{24}$/.test(itemId)) {
        throw new Error('Invalid item ID format');
      }

      if (user && token) {
        try {
          console.log('User is logged in, updating quantity on server');
          // Update quantity in API cart if user is logged in
          const response = await axios.put(`${API_BASE_URL}/api/cart/${itemId}`, 
            { quantity }, 
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.data && response.data.items) {
            const serverCart = calculateTotals(response.data.items);
            console.log('Server returned updated cart with', serverCart.items.length, 'items after quantity update');
            setCart(serverCart);
            
            // Also update localStorage with the server's version
            persistCartToLocalStorage(serverCart);
            
            toast.success('Cart updated');
            return; // Exit early on success
          } else {
            console.log('Server returned empty or invalid cart response');
            // If server didn't return proper cart data, fall back to local
            updateLocalQuantity(itemId, quantity);
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // If the server is unavailable, fall back to local storage
          if (axios.isAxiosError(apiError) && (
              apiError.code === 'ERR_NETWORK' || 
              apiError.response?.status === 503 || // Service unavailable
              apiError.response?.status === 502 || // Bad gateway
              apiError.response?.status === 504    // Gateway timeout
            )) {
            console.log('Server unavailable, updating quantity locally');
            toast.error('Server unavailable. Changes saved locally and will sync when connection is restored.');
            // Continue to local storage logic below
            updateLocalQuantity(itemId, quantity);
            return;
          } else if (axios.isAxiosError(apiError) && apiError.response?.status === 404) {
            // This is likely just a missing route or item not found
            // Continue to local storage logic below without showing an error
            console.log('Item or route not found (404), updating locally');
            updateLocalQuantity(itemId, quantity);
            return;
          } else {
            const err = apiError as AxiosError<ApiErrorResponse>;
            const errorMsg = err.response?.data?.message || 'Failed to update item quantity';
            setError(errorMsg);
            toast.error(errorMsg);
            throw apiError;
          }
        }
      } else {
        console.log('User not logged in, updating quantity locally');
        updateLocalQuantity(itemId, quantity);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      const errorMsg = err.response?.data?.message || 'Failed to update item quantity';
      console.error('Update quantity error:', error);
      setError(errorMsg);
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update quantity in local cart
  const updateLocalQuantity = (itemId: string, quantity: number) => {
    // Update quantity in local cart
    const updatedItems = cart.items.map(item => 
      item._id === itemId ? { ...item, quantity } : item
    );
    
    const updatedCart = calculateTotals(updatedItems);
    setCart(updatedCart);
    
    // Save to local storage
    persistCartToLocalStorage(updatedCart);
    
    toast.success('Cart updated');
  };

  // Clear cart
  const clearCart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Clearing cart');
      if (user && token) {
        try {
          console.log('User is logged in, clearing server cart');
          // Clear API cart if user is logged in
          await axios.delete(`${API_BASE_URL}/api/cart`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Clear cart in state
          setCart({ items: [], totalItems: 0, totalPrice: 0 });
          
          // Mark that this was a user-initiated cart clear
          localStorage.setItem('cartCleared', 'true');
          localStorage.removeItem('cart');
          
          toast.success('Cart cleared');
        } catch (apiError) {
          console.error('API Error when clearing cart:', apiError);
          // If server is unavailable, still clear local cart
          if (axios.isAxiosError(apiError) && (
              apiError.code === 'ERR_NETWORK' || 
              apiError.response?.status === 503 || 
              apiError.response?.status === 502 || 
              apiError.response?.status === 504
            )) {
            console.log('Server unavailable, clearing local cart only');
            toast.error('Server unavailable. Cart cleared locally but may reappear when you reconnect.');
            
            // Clear local cart
            setCart({ items: [], totalItems: 0, totalPrice: 0 });
            localStorage.setItem('cartCleared', 'true');
            localStorage.removeItem('cart');
          } else {
            const err = apiError as AxiosError<ApiErrorResponse>;
            const errorMsg = err.response?.data?.message || 'Failed to clear cart';
            setError(errorMsg);
            toast.error(errorMsg);
            throw apiError;
          }
        }
      } else {
        console.log('User not logged in, clearing local cart only');
        // Clear local cart
        setCart({ items: [], totalItems: 0, totalPrice: 0 });
        localStorage.setItem('cartCleared', 'true');
        localStorage.removeItem('cart');
        toast.success('Cart cleared');
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      const errorMsg = err.response?.data?.message || 'Failed to clear cart';
      console.error('Error clearing cart:', error);
      setError(errorMsg);
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      error, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};