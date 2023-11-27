// Assume you have a server endpoint to get the cart total, for example /get-cart-total
fetch('/get-cart-total')
  .then(response => response.json())
  .then(cartTotal => {
    document.getElementById('cart-total').textContent = cartTotal.toFixed(2);

    paypal.Buttons({
      createOrder: function(data, actions) {
        // Set up the transaction
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: cartTotal.toFixed(2) // Set the cart total as the transaction amount
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        // Capture the funds from the transaction
        return actions.order.capture().then(function(details) {
          // Call your server to save the transaction
          return fetch('/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderID: data.orderID,
              payerID: data.payerID
            })
          });
        });
      }
    }).render('#paypal-button-container');
  })
  .catch(error => {
    console.error('Error fetching cart total:', error);
    // Handle error appropriately (e.g., display an error message to the user)
  });
