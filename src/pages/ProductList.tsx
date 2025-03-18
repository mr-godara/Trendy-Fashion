import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  category: string;
  brand?: string;
  demographic?: string;
  sizes?: string[];
  colors?: string[];
}

const ProductList: React.FC = () => {
  const { category } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const demographicFilter = searchParams.get('demographic');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    sizes: [] as string[],
    colors: [] as string[],
    brands: [] as string[],
    ratings: [] as number[],
    demographic: demographicFilter || '',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Special case for "new" category - fetch new arrivals instead
        if (category === 'new') {
          const response = await axios.get(`${API_BASE_URL}/api/products/new-arrivals`);
          setProducts(response.data);
          return;
        }
        
        // Build query parameters
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (searchQuery) params.append('search', searchQuery);
        if (demographicFilter) params.append('demographic', demographicFilter);
        if (sortBy) params.append('sort', sortBy);

        // Fetch products from API
        const response = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, searchQuery, demographicFilter, sortBy]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handlePriceRangeChange = (index: number, value: string) => {
    const newValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    const newPriceRange = [...filters.priceRange] as [number, number];
    newPriceRange[index] = newValue;
    
    // Ensure min doesn't exceed max and max doesn't go below min
    if (index === 0 && newValue > filters.priceRange[1]) {
      newPriceRange[1] = newValue;
    } else if (index === 1 && newValue < filters.priceRange[0]) {
      newPriceRange[0] = newValue;
    }
    
    setFilters({
      ...filters,
      priceRange: newPriceRange
    });
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      sizes: [],
      colors: [],
      brands: [],
      ratings: [],
      demographic: '',
    });
  };

  const getCategoryTitle = () => {
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    
    if (demographicFilter) {
      return `${demographicFilter}'s Collection`;
    }
    
    if (category) {
      if (category === 'new') {
        return 'New Arrivals';
      }
      return `${category.charAt(0).toUpperCase() + category.slice(1)}s`;
    }
    
    return 'All Products';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{getCategoryTitle()}</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Filters</h2>
            
            {/* Price Range */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                  className="w-20 border rounded-md p-1"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                  className="w-20 border rounded-md p-1"
                  placeholder="Max"
                />
              </div>
            </div>
            
            {/* Sizes */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sizes</h3>
              <div className="space-y-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(size)}
                      onChange={(e) => {
                        const newSizes = e.target.checked
                          ? [...filters.sizes, size]
                          : filters.sizes.filter(s => s !== size);
                        handleFilterChange('sizes', newSizes);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Colors */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Colors</h3>
              <div className="space-y-2">
                {['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow'].map((color) => (
                  <label key={color} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.colors.includes(color)}
                      onChange={(e) => {
                        const newColors = e.target.checked
                          ? [...filters.colors, color]
                          : filters.colors.filter(c => c !== color);
                        handleFilterChange('colors', newColors);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{color}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Brands */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Brands</h3>
              <div className="space-y-2">
                {['StyleBrand', 'DenimCo', 'CasualWear', 'SummerStyle', 'FormalWear'].map((brand) => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={(e) => {
                        const newBrands = e.target.checked
                          ? [...filters.brands, brand]
                          : filters.brands.filter(b => b !== brand);
                        handleFilterChange('brands', newBrands);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Ratings */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.ratings.includes(rating)}
                      onChange={(e) => {
                        const newRatings = e.target.checked
                          ? [...filters.ratings, rating]
                          : filters.ratings.filter(r => r !== rating);
                        handleFilterChange('ratings', newRatings);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{rating}+ Stars</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-2 sm:mb-0">{products.length} products found</p>
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-gray-600">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={handleSortChange}
                className="border rounded-md p-2"
              >
                <option value="newest">Newest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
          
          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;