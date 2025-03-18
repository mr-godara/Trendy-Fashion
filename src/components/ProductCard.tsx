import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/useFavorites';

import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  category: string;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="card group">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product._id}`}>
          <img 
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x300?text=No+Image'} 
            alt={product.name || 'Product'} 
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button 
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full ${isFavorite(product._id) ? 'bg-red-500 text-white' : 'bg-white text-gray-800'} shadow-md hover:scale-110 transition-all`}
            aria-label={isFavorite(product._id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className="h-5 w-5" fill={isFavorite(product._id) ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={handleAddToCart}
            className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-110 transition-all"
            aria-label="Add to cart"
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
          <h3 className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">{product.name || 'Unnamed Product'}</h3>
        </Link>
        <div className="flex items-center mt-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">({(product.rating || 0).toFixed(1)})</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-bold text-gray-800">₹{(product.price || 0).toFixed(2)}</span>
          {product.brand && <span className="text-sm text-gray-600">{product.brand}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;