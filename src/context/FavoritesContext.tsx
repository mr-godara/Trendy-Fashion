import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { addToFavorites as addToFavoritesApi, removeFromFavorites as removeFromFavoritesApi } from './useFavorites';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  brand?: string;
  description?: string;
  demographic?: string;
  sizes?: string[];
  colors?: string[];
  rating?: number;
}

interface FavoritesContextType {
  favorites: Product[];
  loading: boolean;
  addToFavorites: (product: Product) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [localFavoritesMerged, setLocalFavoritesMerged] = useState<boolean>(false);
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);
  const { user, token } = useAuth();

  // Reset merge state when user logs in after logout
  useEffect(() => {
    if (user && token && localStorage.getItem('userLoggedOut') === 'true') {
      setLocalFavoritesMerged(false);
    }
  }, [user, token]);

  // Load favorites from localStorage when not logged in
  useEffect(() => {
    const loadLocalFavorites = () => {
      const localFavorites = localStorage.getItem('favorites');
      if (localFavorites) {
        try {
          const parsedFavorites = JSON.parse(localFavorites);
          setFavorites(parsedFavorites);
          setInitialLoadDone(true);
        } catch (error) {
          console.error('Error parsing local favorites:', error);
          localStorage.removeItem('favorites');
        }
      }
    };

    if (!user || !token) {
      loadLocalFavorites();
    }
  }, [user, token]);

  // Ensure favorites are loaded from localStorage on page refresh
  useEffect(() => {
    if (!initialLoadDone) {
      const localFavorites = localStorage.getItem('favorites');
      if (localFavorites) {
        try {
          const parsedFavorites = JSON.parse(localFavorites);
          setFavorites(parsedFavorites);
          setInitialLoadDone(true);
        } catch (error) {
          console.error('Error parsing local favorites during refresh:', error);
        }
      }
    }
  }, [initialLoadDone]);

  // Save favorites to localStorage when they change
  useEffect(() => {
    // Always save favorites to localStorage, even for logged-in users
    // This ensures favorites persistence even when server is unavailable
    if (initialLoadDone && favorites.length > 0) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } else if (initialLoadDone && favorites.length === 0 && localStorage.getItem('favorites')) {
      // Don't clear localStorage if our state is empty but localStorage has items
      // This prevents wiping out favorites during component mounting
      // Only clear if we've explicitly emptied the favorites
      const userAction = localStorage.getItem('favoritesCleared');
      if (userAction === 'true') {
        localStorage.removeItem('favorites');
        localStorage.removeItem('favoritesCleared');
      }
    }
  }, [favorites, initialLoadDone]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user && token) {
        setLoading(true);
        
        // First check if we have favorites in localStorage
        const localFavorites = localStorage.getItem('favorites');
        let localFavoritesLoaded = false;
        
        if (localFavorites) {
          try {
            const parsedFavorites = JSON.parse(localFavorites);
            // Load local favorites initially while we check server
            setFavorites(parsedFavorites);
            localFavoritesLoaded = true;
          } catch (parseError) {
            console.error('Error parsing local favorites:', parseError);
          }
        }
        
        try {
          // If user just logged in, merge local favorites with server favorites
          await mergeLocalFavoritesWithServer();
          
          try {
            const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data && response.data.length > 0) {
              setFavorites(response.data);
              setInitialLoadDone(true);
            } else {
              // If server returns empty favorites but we have local items
              if (localFavorites && !localFavoritesMerged) {
                try {
                  const parsedFavorites = JSON.parse(localFavorites);
                  if (parsedFavorites.length > 0) {
                    setFavorites(parsedFavorites);
                  }
                } catch (parseError) {
                  console.error('Error parsing local favorites:', parseError);
                }
              }
              setInitialLoadDone(true);
            }
          } catch (apiError) {
            console.error('Error fetching favorites from server:', apiError);
            // Fall back to local favorites if server is unavailable
            if (localFavoritesLoaded) {
              toast.error('Server unavailable. Showing locally saved favorites.');
            }
            setInitialLoadDone(true);
          }
        } catch (error) {
          console.error('Error fetching favorites:', error);
          toast.error('Failed to fetch favorites');
          
          // If server is down, try to use local favorites
          if (axios.isAxiosError(error) && (
            error.code === 'ERR_NETWORK' || 
            error.response?.status === 404 || 
            error.code === 'ERR_BAD_REQUEST'
          )) {
            if (localFavoritesLoaded) {
              setInitialLoadDone(true);
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        // If user is not logged in, load from localStorage
        setLocalFavoritesMerged(false);
        const localFavorites = localStorage.getItem('favorites');
        if (localFavorites) {
          try {
            const parsedFavorites = JSON.parse(localFavorites);
            setFavorites(parsedFavorites);
            setInitialLoadDone(true);
          } catch (error) {
            console.error('Error parsing local favorites:', error);
            localStorage.removeItem('favorites');
            setFavorites([]);
          }
        } else {
          setFavorites([]);
          setInitialLoadDone(true);
        }
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, token]);

  // Merge local favorites with server favorites
  const mergeLocalFavoritesWithServer = async () => {
    const localFavorites = localStorage.getItem('favorites');
    if (localFavorites && user && token && !localFavoritesMerged) {
      try {
        setLoading(true);
        const parsedFavorites = JSON.parse(localFavorites) as Product[];
        
        if (parsedFavorites.length > 0) {
          toast.success('Restoring your favorites from your previous session');
          
          // Add each local favorite to server favorites
          for (const favorite of parsedFavorites) {
            try {
              // Skip if favorite doesn't have a valid _id or essential properties
              if (!favorite._id || !favorite.name || !favorite.price || !favorite.images) {
                continue;
              }
              
              // Skip if item is already in favorites (to prevent duplicate API calls)
              if (await isFavoriteOnServer(favorite._id)) {
                continue;
              }
              
              await addToFavoritesApi(favorite, token, setFavorites);
            } catch (itemError) {
              console.error('Error adding individual favorite:', itemError);
              // Continue with other items if one fails
            }
          }
          
          // Mark as merged but DON'T remove from localStorage yet
          // This way we have a backup if server fetch fails
          setLocalFavoritesMerged(true);
          
          // Fetch updated favorites from server
          try {
            const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data) {
              setFavorites(response.data);
              setInitialLoadDone(true);
              // Only clear local storage AFTER successful server response
              // localStorage.removeItem('favorites');
            }
          } catch (fetchError) {
            console.error('Error fetching favorites after merge:', fetchError);
            // If we can't fetch from server, keep using local favorites
            setFavorites(parsedFavorites);
            setInitialLoadDone(true);
            toast.error('Server unavailable. Using local favorites data.');
          }
        }
      } catch (error) {
        console.error('Error merging favorites:', error);
        toast.error('Failed to restore your previous favorites');
        // Since merging failed, mark initialLoadDone to use local favorites
        setInitialLoadDone(true);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Add a clear favorites function for consistency with cart
  const clearFavorites = async () => {
    setLoading(true);
    try {
      if (user && token) {
        // Clear API favorites if user is logged in
        await axios.delete(`${API_BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Clear local favorites
      setFavorites([]);
      // Mark that this was a user-initiated favorites clear
      localStorage.setItem('favoritesCleared', 'true');
      localStorage.removeItem('favorites');
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Failed to clear favorites');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to check if a product is already in favorites on the server
  const isFavoriteOnServer = async (productId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.some((item: { productId: string }) => item.productId === productId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  };

  const handleAddToFavorites = async (product: Product) => {
    setLoading(true);
    try {
      if (!user || !token) {
        // Handle favorites locally when not logged in
        if (isFavorite(product._id)) {
          toast.error(`${product.name} is already in your favorites!`);
          return;
        }
        
        const newFavorites = [...favorites, product];
        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        toast.success(`${product.name} added to favorites!`);
        return;
      }

      // Validate product ID
      if (!product._id || !/^[0-9a-fA-F]{24}$/.test(product._id)) {
        toast.error('Invalid product data');
        throw new Error('Invalid product data');
      }

      // First check if the product is already a favorite
      if (isFavorite(product._id)) {
        toast.success(`${product.name} is already in your favorites!`);
        return;
      }

      try {
        await addToFavoritesApi(product, token, setFavorites);
        toast.success(`${product.name} added to favorites!`);
      } catch (apiError) {
        // Handle server unavailability
        if (axios.isAxiosError(apiError) && (
            apiError.code === 'ERR_NETWORK' || 
            apiError.response?.status === 404 || 
            apiError.code === 'ERR_BAD_REQUEST'
          )) {
          console.log('Server unavailable, saving favorite locally');
          toast.error('Server unavailable. Favorite saved locally and will sync when connection is restored.');
          
          if (!isFavorite(product._id)) {
            const newFavorites = [...favorites, product];
            setFavorites(newFavorites);
            localStorage.setItem('favorites', JSON.stringify(newFavorites));
          }
          return;
        }
        
        // Handle product already in favorites
        if (axios.isAxiosError(apiError) && apiError.response?.status === 400) {
          if (apiError.response.data?.message === 'Product already in favorites') {
            toast.success(`${product.name} is already in your favorites!`);
            return;
          }
        }
        
        console.error('Error adding to favorites:', apiError);
        toast.error('Failed to add to favorites');
        throw apiError;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (productId: string) => {
    setLoading(true);
    try {
      console.log('Removing favorite with ID:', productId);
      
      if (!user || !token) {
        // Handle removal locally when not logged in
        const updatedFavorites = favorites.filter(item => item._id !== productId);
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        toast.success('Removed from favorites');
        return;
      }

      try {
        // First try to find the favorite item with the matching _id or productId
        const favoriteToRemove = favorites.find(item => 
          item._id === productId || 
          (item.productId && item.productId === productId)
        );
        
        if (!favoriteToRemove) {
          console.error('Favorite not found with ID:', productId);
          toast.error('Item not found in favorites');
          return;
        }
        
        // Use the correct ID for the API call
        const idToRemove = favoriteToRemove._id; // Use the favorite's _id instead of productId
        console.log('Removing favorite with API using ID:', idToRemove);
        
        await removeFromFavoritesApi(idToRemove, token, setFavorites);
        toast.success('Removed from favorites');
      } catch (apiError) {
        // Handle server unavailability
        if (axios.isAxiosError(apiError) && (
            apiError.code === 'ERR_NETWORK' || 
            apiError.response?.status === 404 || 
            apiError.code === 'ERR_BAD_REQUEST'
          )) {
          console.log('Server error or unavailable, removing favorite locally');
          
          // Remove it locally as a fallback
          const updatedFavorites = favorites.filter(item => 
            item._id !== productId && 
            (!item.productId || item.productId !== productId)
          );
          setFavorites(updatedFavorites);
          localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
          return;
        }
        
        console.error('Error removing from favorites:', apiError);
        toast.error('Failed to remove from favorites');
        throw apiError;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(item => item._id === productId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      addToFavorites: handleAddToFavorites,
      removeFromFavorites: handleRemoveFromFavorites,
      isFavorite,
      clearFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
