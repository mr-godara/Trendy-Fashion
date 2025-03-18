import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Product Schema (matching the schema in index.js)
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
  newArrival: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// 5 Products for Children's Collection
const childrenProducts = [
  {
    name: "Kids' Dinosaur Print T-Shirt",
    description: "Colorful and comfortable t-shirt featuring a playful dinosaur print. Made from 100% organic cotton, this t-shirt is both soft on your child's skin and environmentally friendly. The vibrant colors and fun design make it a favorite for everyday wear. Machine washable and designed to maintain its shape and color after multiple washes.",
    price: 799,
    images: [
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1072&q=80",
      "https://images.unsplash.com/photo-1519238360766-5244f4658b81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    category: "t-shirt",
    brand: "KidStyle",
    demographic: "Children",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: ["Blue", "Green", "Red"],
    stock: 120,
    rating: 4.7,
    featured: false,
    newArrival: false
  },
  {
    name: "Children's Denim Overalls",
    description: "Classic denim overalls perfect for active kids. Features adjustable shoulder straps, multiple pockets for small treasures, and a sturdy construction that stands up to playground adventures. The soft cotton blend fabric offers comfort while maintaining durability. Easy snap closures make dressing simple for little ones gaining independence.",
    price: 1299,
    images: [
      "https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      "https://images.unsplash.com/photo-1622290319146-7b63df48a635?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1072&q=80"
    ],
    category: "overalls",
    brand: "TinyTrends",
    demographic: "Children",
    sizes: ["3-4Y", "5-6Y", "7-8Y", "9-10Y"],
    colors: ["Blue", "Light Blue"],
    stock: 85,
    rating: 4.5,
    featured: false,
    newArrival: false
  },
  {
    name: "Kids' Rainbow Sneakers",
    description: "Colorful rainbow sneakers that light up with every step! These fun and comfortable shoes feature a cushioned insole for all-day comfort, a secure velcro closure for easy on/off, and a durable rubber outsole that provides excellent traction. The LED lights are activated by pressure and can last for thousands of steps before needing a battery replacement.",
    price: 999,
    images: [
      "https://images.unsplash.com/photo-1555582874-cb3064e5be06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
      "https://images.unsplash.com/photo-1551861568-c0a6962b69c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1058&q=80"
    ],
    category: "footwear",
    brand: "LittleSteps",
    demographic: "Children",
    sizes: ["EU 28", "EU 29", "EU 30", "EU 31", "EU 32", "EU 33", "EU 34"],
    colors: ["Rainbow", "Blue Rainbow", "Pink Rainbow"],
    stock: 100,
    rating: 4.8,
    featured: true,
    newArrival: false
  },
  {
    name: "Winter Puffer Jacket for Kids",
    description: "Keep your little ones warm and stylish in this premium insulated puffer jacket. The water-resistant outer shell protects against light rain and snow, while the soft fleece lining provides exceptional warmth and comfort. Features a detachable hood, secure zip pockets, and elastic cuffs to keep the cold out. Machine washable and quick-drying for busy family life.",
    price: 1899,
    images: [
      "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1502781252888-9143ba7f074e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
    ],
    category: "outerwear",
    brand: "CozyKids",
    demographic: "Children",
    sizes: ["3-4Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y"],
    colors: ["Red", "Navy Blue", "Green"],
    stock: 75,
    rating: 4.9,
    featured: false,
    newArrival: true
  },
  {
    name: "Kids' Unicorn Pajama Set",
    description: "Magical unicorn-themed pajama set that makes bedtime fun! This adorable two-piece set includes a long-sleeve top and matching pants made from super-soft 100% cotton. The breathable fabric is perfect for a comfortable night's sleep, while the elastic waistband ensures a perfect fit. The enchanting unicorn design with rainbow details will delight any child who loves these mythical creatures.",
    price: 899,
    images: [
      "https://images.unsplash.com/photo-1615886624427-ab7cc278ce3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
      "https://images.unsplash.com/photo-1563642421748-5047b6585a4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
    ],
    category: "sleepwear",
    brand: "DreamyNights",
    demographic: "Children",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"],
    colors: ["Pink", "Purple", "Blue"],
    stock: 90,
    rating: 4.6,
    featured: false,
    newArrival: true
  }
];

// 10 Products for New Arrivals
const newArrivalProducts = [
  {
    name: "Sustainable Linen Blazer",
    description: "Elevate your wardrobe with this eco-conscious linen blazer. Tailored for a modern silhouette with a slightly relaxed fit, this blazer transitions seamlessly from office to evening. The premium European linen is sourced from sustainable farms and manufactured using low-impact dyeing processes. Features include mother-of-pearl buttons, a notched lapel, and a half-lined construction for breathability in warmer weather.",
    price: 3499,
    images: [
      "https://images.unsplash.com/photo-1585412458136-8b858b582002?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
    ],
    category: "blazer",
    brand: "EcoChic",
    demographic: "Women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Sage Green", "Oatmeal", "Navy"],
    stock: 65,
    rating: 4.8,
    featured: false,
    newArrival: true
  },
  {
    name: "Ultra-Light Running Shoes",
    description: "Revolutionary running shoes designed for serious athletes and casual joggers alike. Featuring our proprietary CloudFoam technology that provides exceptional cushioning while maintaining a lightweight feel at just 225 grams. The breathable mesh upper adapts to your foot's natural movement, while the reinforced heel counter ensures stability. The carbon fiber plate in the midsole offers energy return with each stride, enhancing your performance and reducing fatigue.",
    price: 4299,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
    ],
    category: "footwear",
    brand: "SpeedForce",
    demographic: "Unisex",
    sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
    colors: ["Electric Blue/Orange", "Black/Neon Green", "Gray/Pink"],
    stock: 100,
    rating: 4.9,
    featured: true,
    newArrival: true
  },
  {
    name: "Cashmere Blend Sweater",
    description: "Luxuriously soft cashmere blend sweater, perfect for cooler days and cozy evenings. This premium knitwear combines 70% fine wool and 30% cashmere for exceptional warmth without bulk. The ribbed cuffs and hem provide a comfortable fit that retains its shape, while the classic crew neck design ensures versatility. Hand-finished with attention to detail, this sweater represents the perfect balance of everyday luxury and practical comfort.",
    price: 2999,
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1072&q=80",
      "https://images.unsplash.com/photo-1614093302611-8efc4de854d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
    ],
    category: "knitwear",
    brand: "LuxeComfort",
    demographic: "Men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Camel", "Charcoal", "Burgundy", "Forest Green"],
    stock: 70,
    rating: 4.7,
    featured: false,
    newArrival: true
  },
  {
    name: "Crossbody Phone Bag",
    description: "The perfect minimalist accessory for the modern lifestyle. This stylish crossbody phone bag offers convenience without compromising on style. Crafted from premium vegan leather with a pebbled texture that resists scratches and water spots. The main compartment fits all standard smartphone sizes plus essential cards and cash, while the adjustable strap allows for comfortable wear across the body or over the shoulder. The discreet rear pocket provides quick access to frequently used cards.",
    price: 1499,
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
    ],
    category: "accessories",
    brand: "UrbanEssentials",
    demographic: "Unisex",
    sizes: ["One Size"],
    colors: ["Black", "Tan", "Forest Green", "Burgundy"],
    stock: 85,
    rating: 4.6,
    featured: false,
    newArrival: true
  },
  {
    name: "Moisture-Wicking Fitness Leggings",
    description: "High-performance leggings designed for intense workouts and all-day comfort. The four-way stretch fabric moves with your body while providing compression and support in key areas. Our advanced moisture-wicking technology keeps you dry during even the most demanding exercises, while the seamless construction prevents chafing. The high waistband features a hidden pocket for small essentials and stays in place without rolling down. These squat-proof leggings maintain their opacity even during deep stretches.",
    price: 1799,
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1535530992830-e25d07cfa780?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    category: "activewear",
    brand: "FlexFit",
    demographic: "Women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Navy", "Burgundy", "Forest Green"],
    stock: 120,
    rating: 4.8,
    featured: false,
    newArrival: true
  },
  {
    name: "Polarized Aviator Sunglasses",
    description: "Classic aviator sunglasses with modern technology. These timeless frames feature polarized lenses that eliminate glare and provide 100% UV protection. The lightweight metal frame includes adjustable nose pads for a comfortable, custom fit. The gradient tint offers stylish aesthetics while maintaining clear vision. Each pair comes with a premium leather case and microfiber cleaning cloth. These versatile sunglasses complement any face shape and elevate both casual and formal outfits.",
    price: 1299,
    images: [
      "https://images.unsplash.com/photo-1577803645773-f96470509666?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    category: "accessories",
    brand: "ShadeElite",
    demographic: "Unisex",
    sizes: ["One Size"],
    colors: ["Gold/Green", "Silver/Blue", "Black/Gray"],
    stock: 90,
    rating: 4.7,
    featured: false,
    newArrival: true
  },
  {
    name: "Organic Cotton Button-Down Shirt",
    description: "Sustainable style meets comfort in this versatile button-down shirt. Made from 100% organic cotton cultivated without harmful pesticides or synthetic fertilizers. The breathable fabric has been garment-washed for exceptional softness and a lived-in feel from the first wear. The modern slim cut provides a flattering silhouette without feeling restrictive. Features include mother-of-pearl buttons, a chest pocket, and reinforced seams for longevity.",
    price: 1899,
    images: [
      "https://images.unsplash.com/photo-1604695573706-53fc4f1a3f23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1626497764746-6dc36546b388?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80"
    ],
    category: "shirt",
    brand: "EcoBasics",
    demographic: "Men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Light Blue", "Olive", "Navy"],
    stock: 100,
    rating: 4.5,
    featured: false,
    newArrival: true
  },
  {
    name: "Vintage-Inspired Denim Jacket",
    description: "A modern take on the classic denim jacket, featuring authentic vintage-inspired detailing. The premium heavyweight denim has been specially washed to achieve a perfectly broken-in appearance and feel. The flattering cut sits at the hip and includes adjustable button tabs at the waist for a customizable fit. Traditional features include button cuffs, chest pockets, and a point collar. This versatile layering piece works year-round and only gets better with age.",
    price: 2399,
    images: [
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=669&q=80",
      "https://images.unsplash.com/photo-1591213954196-2d0ccb3f8d4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
    ],
    category: "outerwear",
    brand: "Heritage",
    demographic: "Unisex",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Medium Wash", "Light Wash", "Dark Wash"],
    stock: 75,
    rating: 4.9,
    featured: true,
    newArrival: true
  },
  {
    name: "Merino Wool Beanie",
    description: "Luxuriously soft and warm beanie crafted from 100% fine Merino wool. This premium knit hat regulates temperature naturally, keeping you warm without overheating. The breathable properties of Merino wool wick moisture away and resist odors, making it perfect for active outdoor use. The ribbed construction provides gentle stretch for a comfortable fit, while the minimal design ensures versatile styling. This essential winter accessory is lightweight enough to fold into a pocket when not in use.",
    price: 899,
    images: [
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
    ],
    category: "accessories",
    brand: "AlpineComfort",
    demographic: "Unisex",
    sizes: ["One Size"],
    colors: ["Charcoal", "Navy", "Burgundy", "Forest Green", "Camel"],
    stock: 120,
    rating: 4.8,
    featured: false,
    newArrival: true
  },
  {
    name: "Sustainable Canvas Tote Bag",
    description: "Eco-friendly canvas tote that combines style, functionality, and sustainability. Made from 100% organic cotton canvas with reinforced stitching at stress points for durability. The spacious main compartment easily fits everyday essentials, while the interior pocket keeps small items organized. Long handles allow for comfortable shoulder carry, while the flat bottom ensures stability when set down. This versatile bag transitions seamlessly from grocery shopping to beach trips and everything in between.",
    price: 999,
    images: [
      "https://images.unsplash.com/photo-1597633425046-08f5110420b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1562060726-011f0ac4adae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1109&q=80"
    ],
    category: "bags",
    brand: "EcoCarry",
    demographic: "Unisex",
    sizes: ["One Size"],
    colors: ["Natural", "Black", "Navy", "Olive"],
    stock: 100,
    rating: 4.7,
    featured: false,
    newArrival: true
  }
];

async function seedAdditionalProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add children's products
    console.log('Adding children\'s products...');
    const childrenResult = await Product.insertMany(childrenProducts);
    console.log(`Successfully added ${childrenResult.length} children's products`);

    // Add new arrival products
    console.log('Adding new arrival products...');
    const newArrivalResult = await Product.insertMany(newArrivalProducts);
    console.log(`Successfully added ${newArrivalResult.length} new arrival products`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    console.log('Products added successfully:');
    console.log(`- 5 Children's products`);
    console.log(`- 10 New Arrival products`);
  } catch (error) {
    console.error('Error seeding additional products:', error);
    if (error.code === 11000) {
      console.error('Duplicate key error. Some products may already exist in the database.');
    }
    process.exit(1);
  }
}

// Run the seed function
seedAdditionalProducts(); 