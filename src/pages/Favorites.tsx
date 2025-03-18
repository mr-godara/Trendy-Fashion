import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/useFavorites';
import { Trash2, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  rating?: number;
  description?: string;
  demographic?: string;
  sizes?: string[];
  colors?: string[];
  brand?: string;
  category?: string;
}

const Favorites: React.FC = () => {
  const { favorites, removeFromFavorites, loading } = useFavorites();

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      await removeFromFavorites(productId);
      toast.success('Removed from favorites');
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Favorites</h2>
          <p className="text-gray-600 mb-6">You haven't added any items to your favorites yet.</p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Favorites</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((product) => (
          <div key={product._id} className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <Link to={`/product/${product.productId}`} className="block">
              <img 
                src={product.image || ''} 
                alt={product.name} 
                className="w-full h-48 object-cover"
              />
            </Link>
            <button
              onClick={() => handleRemoveFromFavorites(product._id)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
            
            <div className="p-4">
              <Link to={`/product/${product.productId}`} className="block">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600">
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center mb-2">
                <span className="text-xl font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                {product.rating && (
                  <div className="flex items-center ml-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {product.brand && (
                <p className="text-sm text-gray-600 mb-2">Brand: {product.brand}</p>
              )}
              
              {product.category && (
                <p className="text-sm text-gray-600 mb-2">Category: {product.category}</p>
              )}
              
              {product.demographic && (
                <p className="text-sm text-gray-600 mb-2">For: {product.demographic}</p>
              )}
              
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Available Sizes:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.sizes.map((size) => (
                      <span key={size} className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Available Colors:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.colors.map((color) => (
                      <span key={color} className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <Link
                  to={`/product/${product.productId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </Link>
                <Link
                  to={`/product/${product.productId}`}
                  className="btn-primary flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;