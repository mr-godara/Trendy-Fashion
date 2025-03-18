import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  images: [String],
  category: String,
  brand: String,
  demographic: String,
  sizes: [String],
  colors: [String],
  stock: Number,
  rating: Number,
  reviews: [{
    user: {
      _id: String,
      name: String
    },
    rating: Number,
    comment: String,
    date: Date
  }],
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

const products = [
  {
    name: 'Classic White Shirt',
    description: 'A timeless classic white shirt made from premium cotton. Perfect for formal occasions or casual wear when paired with jeans. Features a regular fit, button-down collar, and single cuffs.',
    price: 2599,
    images: [
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80'
    ],
    category: 'shirt',
    brand: 'StyleBrand',
    demographic: 'Men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Blue', 'Black'],
    stock: 100,
    rating: 4.5,
    reviews: [
      {
        user: {
          _id: '507f1f77bcf86cd799439101',
          name: 'John Doe'
        },
        rating: 5,
        comment: 'Great quality shirt, fits perfectly!',
        date: '2025-05-15T10:30:00Z'
      },
      {
        user: {
          _id: '507f1f77bcf86cd799439102',
          name: 'Jane Smith'
        },
        rating: 4,
        comment: 'Nice material, but runs slightly large.',
        date: '2025-05-10T14:20:00Z'
      }
    ],
    featured: true
  },
  {
    name: 'Slim Fit Jeans',
    description: 'Modern slim fit jeans made from premium denim. Features a comfortable stretch fabric, slim leg cut, and classic five-pocket design. Perfect for both casual and semi-formal occasions.',
    price: 1599,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80'
    ],
    category: 'pant',
    brand: 'DenimCo',
    demographic: 'Men',
    sizes: ['30', '32', '34', '36'],
    colors: ['Blue', 'Black', 'Gray'],
    stock: 75,
    rating: 4.2,
    reviews: [
      {
        user: {
          _id: '507f1f77bcf86cd799439103',
          name: 'Mike Johnson'
        },
        rating: 4,
        comment: 'Great fit and comfortable to wear all day.',
        date: '2025-05-12T09:15:00Z'
      }
    ],
    featured: true
  },
  {
    name: 'Casual T-Shirt',
    description: 'Comfortable casual t-shirt made from soft cotton. Features a relaxed fit, crew neck, and short sleeves. Perfect for everyday wear and casual occasions.',
    price: 599,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    category: 'tshirt',
    brand: 'CasualWear',
    demographic: 'Men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Gray', 'Navy'],
    stock: 120,
    rating: 4.0,
    reviews: [
      {
        user: {
          _id: '507f1f77bcf86cd799439104',
          name: 'Sarah Wilson'
        },
        rating: 4,
        comment: 'Great basic tee, good quality for the price.',
        date: '2025-05-08T16:45:00Z'
      }
    ],
    featured: false
  },
  {
    name: 'Summer Dress',
    description: 'Light and breezy summer dress made from breathable fabric. Features a flattering A-line cut, adjustable straps, and a subtle floral pattern. Perfect for warm weather and casual occasions.',
    price: 2549,
    images: [
      'https://images.unsplash.com/photo-1612336307429-8a898d10e223?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80',
      'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    category: 'tops',
    brand: 'SummerStyle',
    demographic: 'Women',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Floral', 'Blue', 'Pink'],
    stock: 60,
    rating: 4.7,
    reviews: [
      {
        user: {
          _id: '507f1f77bcf86cd799439105',
          name: 'Emma Davis'
        },
        rating: 5,
        comment: 'Beautiful dress, perfect for summer!',
        date: '2025-05-20T11:30:00Z'
      }
    ],
    featured: true
  },
  {
    name: 'Formal Trouser',
    description: 'Classic formal trousers made from premium wool blend. Features a straight leg cut, side pockets, and a comfortable elastic waistband. Perfect for business wear and formal occasions.',
    price: 899,
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80',
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    category: 'trouser',
    brand: 'FormalWear',
    demographic: 'Men',
    sizes: ['30', '32', '34', '36'],
    colors: ['Black', 'Navy', 'Gray'],
    stock: 80,
    rating: 4.3,
    reviews: [
      {
        user: {
          _id: '507f1f77bcf86cd799439106',
          name: 'David Brown'
        },
        rating: 4,
        comment: 'Great formal trousers, very comfortable.',
        date: '2025-05-18T13:15:00Z'
      }
    ],
    featured: false
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`Successfully inserted ${result.length} products`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 