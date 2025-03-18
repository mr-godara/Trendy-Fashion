import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, ShoppingBag, Heart } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/useFavorites';
import { API_BASE_URL } from '../config/api';

import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  category: string;
  description?: string;
  brand?: string;
  demographic?: string;
  sizes?: string[];
  colors?: string[];
}

const Home: React.FC = () => {
  // Initialize state with empty arrays to prevent map errors
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();
  const { addToFavorites, isFavorite, removeFromFavorites } = useFavorites();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products from API');
        
        // Fetch featured products
        const featuredResponse = await axios.get(`${API_BASE_URL}/api/products/featured`);
        console.log('Featured products received:', featuredResponse.data);
        setFeaturedProducts(featuredResponse.data);
        
        // Fetch new arrivals (limit to 4 for homepage)
        const newArrivalsResponse = await axios.get(`${API_BASE_URL}/api/products/new-arrivals?limit=4`);
        console.log('New arrivals received:', newArrivalsResponse.data);
        setNewArrivals(newArrivalsResponse.data);
        
        // Fetch best sellers
        const bestSellersResponse = await axios.get(`${API_BASE_URL}/api/products/best-sellers`);
        console.log('Best sellers received:', bestSellersResponse.data);
        setBestSellers(bestSellersResponse.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        // Initialize with empty arrays in case of error
        setFeaturedProducts([]);
        setNewArrivals([]);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    try {
      if (isFavorite(product._id)) {
        await removeFromFavorites(product._id);
        toast.success(`${product.name} removed from favorites`);
      } else {
        await addToFavorites(product);
        toast.success(`${product.name} added to favorites!`);
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const categories = [
    { name: 'Shirts', path: '/products/shirt', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80' },
    { name: 'T-Shirts', path: '/products/tshirt', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80' },
    { name: 'Pants', path: '/products/pant', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80' },
    { name: 'Trousers', path: '/products/trouser', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80' },
    { name: 'Tops', path: '/products/tops', image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80' },
  ];

  const demographics = [
    { name: 'Men', path: '/products?demographic=Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80' },
    { name: 'Women', path: '/products?demographic=Women', image: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80' },
    { name: 'Kids', path: '/products?demographic=Children', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80' },
  ];

  const renderProductCard = (product: Product) => (
    <div key={product._id} className="card group">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product._id}`}>
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button 
            onClick={() => handleToggleFavorite(product)}
            className={`p-2 rounded-full ${isFavorite(product._id) ? 'bg-red-500 text-white' : 'bg-white text-gray-800'} shadow-md hover:scale-110 transition-all`}
          >
            <Heart className="h-5 w-5" fill={isFavorite(product._id) ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => handleAddToCart(product)}
            className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-110 transition-all"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
        {product.rating >= 4.5 && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-medium">
            Top Rated
          </div>
        )}
      </div>
      <div className="p-4">
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center mt-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">({product.rating.toFixed(1)})</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-bold text-gray-800">₹{product.price.toFixed(2)}</span>
          <span className="text-sm text-gray-600">{product.brand}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Fashion Banner" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Summer Collection 2025</h1>
            <p className="text-lg md:text-xl mb-8">Discover the latest trends and styles for the upcoming season. Quality fashion at affordable prices.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary">
                Shop Now
              </Link>
              <Link to="/products/new" className="btn-secondary">
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">Shop by Category</h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link key={category.name} to={category.path} className="group">
                <div className="relative rounded-lg overflow-hidden shadow-md h-48">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <h3 className="text-white text-lg font-medium p-4 w-full text-center">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Demographics Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">Shop by Collection</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demographics.map((demo) => (
              <Link key={demo.name} to={demo.path} className="group">
                <div className="relative rounded-lg overflow-hidden shadow-md h-80">
                  <img 
                    src={demo.image} 
                    alt={demo.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-6 w-full">
                      <h3 className="text-white text-2xl font-bold mb-2">{demo.name}'s Collection</h3>
                      <span className="inline-block bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-transform group-hover:scale-105">
                        Shop Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => renderProductCard(product))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">New Arrivals</h2>
            <Link to="/products/new" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => renderProductCard(product))}
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">Best Sellers</h2>
            <Link to="/products?sort=bestselling" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => renderProductCard(product))}
          </div>
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2215&q=80" 
                alt="Special Offer" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative bg-gradient-to-r from-blue-600/90 to-blue-600/20 py-12 px-6 md:py-16 md:px-12 lg:py-20 lg:px-16">
              <div className="max-w-lg">
                <h2 className="text-3xl font-bold text-white mb-4">Special Offer</h2>
                <p className="text-white text-lg mb-6">Get 20% off on all new arrivals. Use code <span className="font-bold">SUMMER25</span> at checkout.</p>
                <Link to="/products/new" className="btn-accent">
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free shipping on all orders over ₹500</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03  9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure payment processing</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-600">14 days return policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;