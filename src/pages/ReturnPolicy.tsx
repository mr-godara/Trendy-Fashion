import React from 'react';
import { Link } from 'react-router-dom';

const ReturnPolicy: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Return & Refund Policy</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="prose max-w-none">
          <p>
            At TrendyFashion, we want you to be completely satisfied with your purchase. If for any reason you're not happy with your order, we offer a simple and hassle-free return process.
          </p>
          
          <h2>Return Policy Overview</h2>
          <ul>
            <li>Returns are accepted within 14 days of delivery</li>
            <li>Items must be unworn, unwashed, and in original condition with all tags attached</li>
            <li>Original packaging should be included when possible</li>
            <li>Free returns on all domestic orders</li>
            <li>Refunds are processed within 5-7 business days after we receive your return</li>
          </ul>
          
          <h2>How to Return an Item</h2>
          <ol>
            <li>
              <strong>Initiate your return:</strong> Log into your account and go to the "Orders" section. Select the order containing the item(s) you wish to return and follow the return instructions. Alternatively, you can contact our customer service team for assistance.
            </li>
            <li>
              <strong>Print your return label:</strong> Once your return is approved, you'll receive a prepaid return shipping label via email. Print this label and attach it to your package.
            </li>
            <li>
              <strong>Package your return:</strong> Place the item(s) in their original packaging if possible, or use a secure box or envelope. Include all tags, accessories, and documentation that came with your purchase.
            </li>
            <li>
              <strong>Drop off your package:</strong> Take your package to any authorized shipping location. We recommend keeping the tracking information until your return is processed.
            </li>
          </ol>
          
          <h2>Refund Process</h2>
          <p>
            Once we receive your return, our team will inspect the item(s) to ensure they meet our return policy requirements. After approval, we'll process your refund to the original payment method used for the purchase. Please allow 5-7 business days for the refund to appear in your account.
          </p>
          
          <h2>Exchanges</h2>
          <p>
            If you'd like to exchange an item for a different size or color, we recommend returning the original item for a refund and placing a new order for the desired item. This ensures you get the item you want as quickly as possible, as exchanges may take longer to process.
          </p>
          
          <h2>Non-Returnable Items</h2>
          <p>
            The following items cannot be returned:
          </p>
          <ul>
            <li>Items marked as "Final Sale" or "Non-Returnable"</li>
            <li>Personalized or custom-made items</li>
            <li>Intimate apparel, swimwear, and accessories for hygiene reasons</li>
            <li>Items that show signs of wear, damage, or alteration</li>
            <li>Gift cards</li>
          </ul>
          
          <h2>Damaged or Defective Items</h2>
          <p>
            If you receive a damaged or defective item, please contact our customer service team within 48 hours of delivery. We'll arrange for a return and replacement or refund at no cost to you. Please provide photos of the damaged or defective item to help us process your claim more efficiently.
          </p>
          
          <h2>International Returns</h2>
          <p>
            International customers are responsible for return shipping costs and any customs fees associated with returning items. Please contact our customer service team for specific instructions on international returns.
          </p>
          
          <h2>Sale Items</h2>
          <p>
            Items purchased on sale are eligible for return unless marked as "Final Sale." Please note that some seasonal or clearance sales may have modified return policies, which will be clearly indicated at the time of purchase.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our return policy or need assistance with a return, please don't hesitate to contact our customer service team:
          </p>
          <ul>
            <li>Email: returns@trendyfashion.com</li>
            <li>Phone: +916548754698</li>
            <li>Live Chat: Available on our website during business hours</li>
          </ul>
          
          <p>
            <em>Last updated: January 1, 2025</em>
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Need Help?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Our customer service team is here to assist you with any questions or concerns about returns and refunds.
        </p>
        <Link to="/contact" className="btn-primary">
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default ReturnPolicy;