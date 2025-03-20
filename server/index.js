import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });


// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: "https://trendy-fashion-dun.vercel.app", // Allow frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true // Allow cookies & authorization headers
}));

// ✅ Manually set CORS headers for preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://trendy-fashion-dun.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Handle preflight requests
app.options('*', (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    console.log('Connecting to MongoDB with URI:', uri);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Initialize Razorpay
let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully');
  } else {
    console.warn('Razorpay credentials missing. Payment gateway will be in test mode.');
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
}

// Models
// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String, required: true }],
  category: { type: String, required: true },
  brand: { type: String },
  demographic: { type: String },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  stock: { type: Number, default: 100 },
  rating: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    color: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Cart = mongoose.model('Cart', cartSchema);

// Favorites Model
const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  brand: { type: String },
  demographic: { type: String },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  rating: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

// Order Model
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true },
    size: { type: String },
    color: { type: String }
  }],
  shippingInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  orderSummary: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Middleware for authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// API Routes
// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const {
      category,
      search,
      demographic,
      sort,
      minPrice,
      maxPrice,
      sizes,
      colors,
      brands,
      ratings
    } = req.query;

    let query = {};

    // Apply filters
    if (category) query.category = category;
    if (demographic) query.demographic = demographic;
    if (sizes) query.sizes = { $in: sizes.split(',') };
    if (colors) query.colors = { $in: colors.split(',') };
    if (brands) query.brand = { $in: brands.split(',') };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (ratings) {
      query.rating = { $gte: Math.min(...ratings.split(',').map(Number)) };
    }

    // Apply search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply sorting
    let sortOption = {};
    switch (sort) {
      case 'price-low-high':
        sortOption = { price: 1 };
        break;
      case 'price-high-low':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  try {
    console.log('Fetching featured products');
    // First try to find products marked as featured
    let products = await Product.find({ featured: true }).limit(4);
    
    // If no featured products found, get the most recent products as fallback
    if (!products || products.length === 0) {
      console.log('No featured products found, fetching recent products');
      products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(4);
    }
    
    console.log('Found products:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Error fetching featured products' });
  }
});

// Get new arrivals
app.get('/api/products/new-arrivals', async (req, res) => {
  try {
    console.log('Fetching new arrivals');
    
    // Check if limit is specified in query params
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log('Found new arrivals:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ message: 'Error fetching new arrivals' });
  }
});

// Get best sellers
app.get('/api/products/best-sellers', async (req, res) => {
  try {
    console.log('Fetching best sellers');
    const products = await Product.find()
      .sort({ rating: -1 })
      .limit(4);
    console.log('Found best sellers:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({ message: 'Error fetching best sellers' });
  }
});

app.get('/api/products/related/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { brand: product.brand },
        { demographic: product.demographic }
      ]
    }).limit(3);

    res.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Error fetching related products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    console.log('Fetching product with ID:', req.params.id);
    
    if (!req.params.id) {
      console.error('No product ID provided');
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(req.params.id);
    console.log('Product found:', product);
    
    if (!product) {
      console.error('Product not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Cart Routes
app.get('/api/cart', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

app.post('/api/cart', auth, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: [{ productId, quantity, size, color }]
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId && 
                item.size === size && 
                item.color === color
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, size, color });
      }
    }

    cart.updatedAt = new Date();
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json(populatedCart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart' });
  }
});

app.put('/api/cart/:productId', auth, async (req, res) => {
  try {
    const { quantity, size, color } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === req.params.productId && 
              item.size === size && 
              item.color === color
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json(populatedCart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Error updating cart item' });
  }
});

app.delete('/api/cart/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if we're removing by item _id or by productId
    const itemId = req.params.productId;
    
    // First try to remove by item _id (which is more precise)
    let itemRemoved = false;
    cart.items = cart.items.filter(item => {
      // Convert both to string to ensure proper comparison
      if (item._id.toString() === itemId) {
        itemRemoved = true;
        return false; // Remove this item
      }
      return true; // Keep this item
    });
    
    // If no item was removed by _id, try removing by productId
    if (!itemRemoved) {
      cart.items = cart.items.filter(item => item.productId.toString() !== itemId);
    }
    
    cart.updatedAt = new Date();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json(populatedCart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
});

app.delete('/api/cart', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

// Favorites Routes
app.get('/api/favorites', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id });
    
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/favorites', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      productId
    });
    
    if (existingFavorite) {
      return res.status(400).json({ message: 'Product already in favorites' });
    }
    
    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Add to favorites with all product details
    const favorite = new Favorite({
      user: req.user._id,
      productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      description: product.description,
      category: product.category,
      brand: product.brand,
      demographic: product.demographic,
      sizes: product.sizes,
      colors: product.colors,
      rating: product.rating
    });
    
    await favorite.save();
    
    // Return updated favorites list
    const favorites = await Favorite.find({ user: req.user._id });
    
    res.status(201).json(favorites);
  } catch (error) {
    console.error('Add to favorites error:', error);
    if (error instanceof mongoose.Error) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/favorites/:id', auth, async (req, res) => {
  try {
    // Remove from favorites using the favorite's _id
    await Favorite.findByIdAndDelete(req.params.id);
    
    // Return updated favorites list
    const favorites = await Favorite.find({ user: req.user._id });
    
    res.json(favorites);
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all favorites for a user
app.delete('/api/favorites', auth, async (req, res) => {
  try {
    // Remove all favorites for this user
    await Favorite.deleteMany({ user: req.user._id });
    
    res.json([]);
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Routes
app.get('/api/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order endpoint
app.put('/api/orders/:id/cancel', auth, async (req, res) => {
  try {
    console.log('Cancel order request received for ID:', req.params.id);
    // Find the order belonging to this user
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      console.log('Order not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if the order can be cancelled (only processing orders can be cancelled)
    if (order.orderStatus !== 'processing') {
      console.log('Cannot cancel order in status:', order.orderStatus);
      return res.status(400).json({ 
        message: `Order cannot be cancelled in ${order.orderStatus} status` 
      });
    }
    
    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.updatedAt = Date.now();
    
    await order.save();
    
    console.log('Order cancelled successfully:', order._id);
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod, orderSummary } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }
    
    if (!shippingInfo) {
      return res.status(400).json({ message: 'Shipping information is required' });
    }
    
    if (!orderSummary) {
      return res.status(400).json({ message: 'Order summary is required' });
    }
    
    // Generate order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Create Razorpay order if payment method is razorpay
    let razorpayOrderId = null;
    
    if (paymentMethod === 'razorpay') {
      try {
        if (!razorpay) {
          console.warn('Razorpay not initialized. Creating mock order.');
          razorpayOrderId = 'mock_order_' + Date.now();
        } else {
          const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(orderSummary.total * 100), // amount in paise
            currency: 'INR',
            receipt: orderNumber,
            payment_capture: 1
          });
          
          razorpayOrderId = razorpayOrder.id;
        }
      } catch (paymentError) {
        console.error('Failed to create Razorpay order:', paymentError);
        // Still create the order but with a mock payment ID
        razorpayOrderId = 'mock_order_' + Date.now();
      }
    }
    
    // Prepare order items format
    const formattedItems = items.map(item => {
      const productId = typeof item.productId === 'object' ? item.productId._id : item.productId;
      return {
        productId: productId || item._id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        image: item.image || (item.images && item.images.length > 0 ? item.images[0] : ''),
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color
      };
    });
    
    // Create order
    const order = new Order({
      user: req.user._id,
      orderNumber,
      items: formattedItems,
      shippingInfo,
      orderSummary,
      paymentMethod,
      razorpayOrderId,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'processing'
    });
    
    await order.save();
    
    res.status(201).json({
      orderId: razorpayOrderId || order._id,
      amount: orderSummary.total,
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Payment Routes
app.post('/api/payments/verify', auth, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    
    console.log('Payment verification request received for:', { orderId, paymentId });
    
    // Find the order using a strict lookup
    let order;
    
    // Only allow orders stored by MongoDB _id
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findOne({ 
        _id: orderId,
        user: req.user._id 
      });
    }
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order found:', order._id);
    
    // Generate and validate the signature using live Razorpay keys
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    // Update order details upon successful verification
    order.razorpayPaymentId = paymentId;
    order.razorpaySignature = signature;
    order.paymentStatus = 'paid';
    order.updatedAt = Date.now();
    
    await order.save();
    
    console.log('Payment marked as verified for order:', order._id);
    res.json({ message: 'Payment verified successfully', orderId: order._id });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});


// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
