var express = require('express');
var router = express.Router();
var paypal = require('paypal-rest-sdk');

// Set up PayPal configuration
paypal.configure({
  mode: 'sandbox', 
  client_id: 'AV_Z5dpE4YNKAa6SmsMKf-G-eTJE-wP7DE3YXe2RIpFb2XBrlaprf_Xg9z4g1Q0DAf6Vh0w3TvCPHqZh',
  client_secret: 'ECF9qV8laXNcebGZ9LOlweu1h-TR5M6kNb-6vnMGB98QrQNgCb33lPbCRfrJ0qjGh92kqzCho0oaInx7',
});

const products = [
  { id: 1, name: 'Meta Quest 2 128 GB', price: 349.99, imageUrl: '/images/product1.jpg' },
  { id: 2, name: 'Samsung 55" LED TV', price: 499.99, imageUrl: '../images/product2.jpg' },
  { id: 3, name: 'Apple Iphone 15 ', price: 1129.99, imageUrl: '../images/product3.jpg' },
  { id: 4, name: 'Samsung Galaxy Buds 2 Pro', price: 199.99, imageUrl: '../images/product4.jpg' }
];




router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});



router.get('/products', function(req, res, next) {
  res.render('products', { title: 'Explore Our Products', products });
});

let cart = [];

router.post('/addToCart/:productId', function(req, res, next) {
  const productId = req.params.productId;
  const productToAdd = products.find(product => product.id.toString() === productId);

  if (productToAdd) {
    cart.push(productToAdd);
    console.log('Product added to cart:', productToAdd);
  } else {
    console.log('Product not found.');
  }

  res.redirect('/products');
});

router.post('/removeFromCart/:productId', function(req, res, next) {
  const productId = req.params.productId;
  const indexToRemove = cart.findIndex(item => item.id.toString() === productId);

  if (indexToRemove !== -1) {
    const removedProduct = cart.splice(indexToRemove, 1)[0];
    console.log('Product removed from cart:', removedProduct);
  } else {
    console.log('Product not found in cart.');
  }

  res.redirect('/cart');
});

router.get('/get-cart-total', function(req, res, next) {
  const totalAmount = calculateCartTotal(cart);
  res.json({ totalAmount });
})

// Function to calculate total amount
function calculateCartTotal(cart) {
  return cart.reduce((total, item) => total + item.price, 0);
}

router.get('/cart', function(req, res, next) {
  const totalAmount = calculateCartTotal(cart);
  res.render('cart', { title: 'Your Cart', cart, totalAmount });
});

// Render the checkout page
router.get('/checkout', (req, res) => {
  const totalAmount = calculateCartTotal(cart);
  res.render('checkout', { title: 'Checkout', cart, totalAmount });
})


// Process PayPal payment
router.post('/checkout/paypal', (req, res) => {
  const totalAmount = calculateCartTotal(cart);

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    },
    transactions: [
      {
        item_list: {
          items: cart.map(item => ({
            name: item.name,
            sku: item.id.toString(),
            price: item.price.toFixed(2),
            currency: 'CAD',
            quantity: 1,
          })),
        },
        amount: {
          currency: 'CAD',
          total: totalAmount.toFixed(2),
        },
        description: 'Your order description',
      },
    ],
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

// Handle PayPal success
router.get('/success', (req, res) => res.send('Payment successful'));

// Handle PayPal cancel
router.get('/cancel', (req, res) => res.send('Payment cancelled'))



module.exports = router;
