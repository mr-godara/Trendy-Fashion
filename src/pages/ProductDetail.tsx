import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Share2, ChevronRight, Truck, RotateCcw, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/useFavorites';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  brand?: string;
  demographic?: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  rating: number;
  reviews: {
    user: {
      _id: string;
      name: string;
    };
    rating: number;
    comment: string;
    date: string;
  }[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('description');
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        console.log('Fetching product with ID:', id);
        console.log('API URL:', `${API_BASE_URL}/api/products/${id}`);
        
        const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        console.log('Product data received:', response.data);
        
        if (!response.data) {
          throw new Error('No product data received');
        }
        
        setProduct(response.data);
        
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0]);
        } else {
          console.warn('No images found for product');
        }
        
        if (response.data.sizes && response.data.sizes.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
        
        if (response.data.colors && response.data.colors.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
        
        // Fetch related products
        console.log('Fetching related products');
        const relatedResponse = await axios.get(`${API_BASE_URL}/api/products/related/${id}`);
        console.log('Related products received:', relatedResponse.data);
        setRelatedProducts(relatedResponse.data);
      } catch (err) {
        console.error('Error fetching product:', err);
        if (axios.isAxiosError(err)) {
          console.error('Axios error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
          });
        }
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      console.error('No product ID provided');
      setError('No product ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (product && value > product.stock) {
      toast.error(`Only ${product.stock} items available`);
      return;
    }
    setQuantity(value);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }
    
    if (!selectedColor && product.colors && product.colors.length > 0) {
      toast.error('Please select a color');
      return;
    }
    
    try {
      await addToCart(product, quantity, selectedSize, selectedColor);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">{error || 'Product not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link to="/products" className="ml-1 text-gray-600 hover:text-blue-600 md:ml-2">
                Products
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link to={`/products/${product.category}`} className="ml-1 text-gray-600 hover:text-blue-600 md:ml-2">
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}s
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="ml-1 text-gray-500 md:ml-2">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={selectedImage} 
              alt={product.name} 
              className="w-full h-96 object-contain"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image)}
                className={`rounded-md overflow-hidden border-2 ${selectedImage === image ? 'border-blue-600' : 'border-transparent'}`}
              >
                <img 
                  src={image} 
                  alt={`${product.name} - View ${index + 1}`} 
                  className="w-full h-24 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-gray-600">{product.rating.toFixed(1)} ({product.reviews.length} reviews)</span>
          </div>
          
          <div className="text-2xl font-bold text-gray-800 mb-4">₹{product.price.toFixed(2)}</div>
          
          <p className="text-gray-600 mb-6">{product.description}</p>
          
          {/* Product Options */}
          <div className="space-y-6">
            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`border rounded-md py-2 px-3 flex items-center justify-center text-sm font-medium ${
                        selectedSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                <div className="grid grid-cols-5 gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`border rounded-md py-2 px-3 flex items-center justify-center text-sm font-medium ${
                        selectedColor === color
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-12 text-center border-none focus:outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                disabled={product.stock === 0}
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
              
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md ${
                  isFavorite(product._id)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Heart className="h-5 w-5" fill={isFavorite(product._id) ? "currentColor" : "none"} />
                {isFavorite(product._id) ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
            
            {/* Share */}
            <div className="flex items-center gap-2">
              <button className="text-gray-600 hover:text-blue-600">
                <Share2 className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">Share this product</span>
            </div>
            
            {/* Product Highlights */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Free shipping on orders over 500</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">14-day return policy</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Tabs */}
      <div className="mb-12">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'description'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews ({product.reviews.length})
            </button>
          </nav>
        </div>
        
        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p>{product.description}</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
              <p>Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Product Details</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li><span className="font-medium">Brand:</span> {product.brand}</li>
                    <li><span className="font-medium">Category:</span> {product.category}</li>
                    <li><span className="font-medium">Demographic:</span> {product.demographic}</li>
                    <li><span className="font-medium">Material:</span> Premium Cotton</li>
                    <li><span className="font-medium">Care:</span> Machine wash cold, tumble dry low</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Sizing Information</h3>
                  <p className="text-gray-600 mb-2">This product runs true to size. Please refer to the size chart below:</p>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chest (in)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Length (in)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">S</td>
                          <td className="px-4 py-2 text-sm text-gray-500">36-38</td>
                          <td className="px-4 py-2 text-sm text-gray-500">28</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">M</td>
                          <td className="px-4 py-2 text-sm text-gray-500">39-41</td>
                          <td className="px-4 py-2 text-sm text-gray-500">29</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">L</td>
                          <td className="px-4 py-2 text-sm text-gray-500">42-44</td>
                          <td className="px-4 py-2 text-sm text-gray-500">30</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">XL</td>
                          <td className="px-4 py-2 text-sm text-gray-500">45-47</td>
                          <td className="px-4 py-2 text-sm text-gray-500">31</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Customer Reviews</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">{product.rating.toFixed(1)} out of 5</span>
                  <span className="text-gray-600">Based on {product.reviews.length} reviews</span>
                </div>
              </div>
              
              {product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review, index) => (
                    <div key={index} className="border-b pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{review.rating} out of 5</span>
                      </div>
                      <h4 className="font-medium">{review.user.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">{formatDate(review.date)}</p>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
              )}
              
              <div className="mt-6">
                <button className="btn-primary">Write a Review</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct._id} className="card group">
                <div className="relative overflow-hidden">
                  <Link to={`/product/${relatedProduct._id}`}>
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.name} 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (isFavorite(relatedProduct._id)) {
                          removeFromFavorites(relatedProduct._id);
                          toast.success(`${relatedProduct.name} removed from favorites`);
                        } else {
                          addToFavorites(relatedProduct);
                          toast.success(`${relatedProduct.name} added to favorites!`);
                        }
                      }}
                      className={`p-2 rounded-full ${isFavorite(relatedProduct._id) ? 'bg-red-500 text-white' : 'bg-white text-gray-800'} shadow-md hover:scale-110 transition-all`}
                    >
                      <Heart className="h-5 w-5" fill={isFavorite(relatedProduct._id) ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => {
                        addToCart(relatedProduct, 1);
                        toast.success(`${relatedProduct.name} added to cart!`);
                      }}
                      className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-110 transition-all"
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <Link to={`/product/${relatedProduct._id}`} className="block">
                    <h3 className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">{relatedProduct.name}</h3>
                  </Link>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(relatedProduct.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">({relatedProduct.rating.toFixed(1)})</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-gray-800">₹{relatedProduct.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-600">{relatedProduct.brand}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;