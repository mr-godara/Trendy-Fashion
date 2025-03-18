import { useContext } from 'react';
import axios from 'axios';
import FavoritesContext from './FavoritesContext';
import { API_BASE_URL } from '../config/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  brand?: string;
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const addToFavorites = async (product: Product, token: string, setFavorites: React.Dispatch<React.SetStateAction<Product[]>>) => {
  try {
    // Validate product ID
    if (!product || !product._id || !/^[0-9a-fA-F]{24}$/.test(product._id)) {
      throw new Error('Invalid product data or product ID');
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/favorites`,
      { productId: product._id },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (response.data) {
      setFavorites(response.data);
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      // Handle case where item is already in favorites
      if (error.response.data?.message === 'Product already in favorites') {
        console.log('Product is already in favorites');
        // Get current favorites to update state
        try {
          const favResponse = await axios.get(
            `${API_BASE_URL}/api/favorites`,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          if (favResponse.data) {
            setFavorites(favResponse.data);
          }
        } catch (fetchError) {
          console.error('Error fetching favorites after duplicate:', fetchError);
        }
        return; // Don't throw error for this case
      }
    }
    throw error;
  }
};

export const removeFromFavorites = async (productId: string, token: string, setFavorites: React.Dispatch<React.SetStateAction<Product[]>>) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/favorites/${productId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setFavorites(response.data);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};
