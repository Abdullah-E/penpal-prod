import React, { useCallback, useState, useEffect } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// This is your test secret API key.
const stripePromise = loadStripe("pk_test_51PgWq2Euyj8xye751S0KM3U2HKAM0aKKCO1sgNePM9n0N22CMLvzOgGjReo4ikEcqIhqL9j6f0VRtdlELPP7Ht1q00PMKpRLgM");
const BASE_URL = 'http://localhost:8000/api/v1'
const productName = 'year_profile'
const auth_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjBjYjQyNzQyYWU1OGY0ZGE0NjdiY2RhZWE0Yjk1YTI5ZmJhMGM1ZjkiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoidXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9hd2F5b3V0LTU1ZmUyIiwiYXVkIjoiYXdheW91dC01NWZlMiIsImF1dGhfdGltZSI6MTcyMTk1NjUyNSwidXNlcl9pZCI6Ik12dGhQSjk3MzJWdjVIU1NsZnZJdVlWQ1lPQTIiLCJzdWIiOiJNdnRoUEo5NzMyVnY1SFNTbGZ2SXVZVkNZT0EyIiwiaWF0IjoxNzIxOTU2NTI1LCJleHAiOjE3MjE5NjAxMjUsImVtYWlsIjoiY29obGVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImNvaGxlQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.eGl11kTkoMX8ZPTSuGCzC9Oz5kyxGGMAzty5D7VtLnSZN_uj5Cc71sG1l9442x-L0CVc7OT4qznRGOZc9BSQp3BO3weUlBI6z27OhVnr8dF8ni4HRsqXzH3cdauZFqh7dupxakitb9PVSgTDqfY9YraHTtOVMLiMBVjZUKSLMaMdy25fWHpy40Uj08JqsAXKd9IbdN9Pc1pTo4YqK6wxRQxZQGV6ZIcESa6SGU4jrzdIML7T5SxFbsET8n4tC2RjfDWnB1dxbDyCMut1a14dxpaUzvsvNS2Fcwd5Q-GeQCWLuap2k4MKeWM13Fm15ivwiESS5JUudGEEePFxEmQhiw"

const CheckoutForm = () => {
  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    return fetch(BASE_URL+"/payment/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
        productName: productName,
        quantity: 1,
      }),
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, []);

  const options = {fetchClientSecret};

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

const Return = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    fetch(`${BASE_URL}/payment/session-status?session_id=${sessionId}`,{
      headers: {
        'Authorization': `Bearer ${auth_token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      });
  }, []);

  if (status === 'open') {
    return (
      <Navigate to="/checkout" />
    )
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to {customerEmail}.

          If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
        </p>
      </section>
    )
  }

  return null;
}

const App = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/checkout" element={<CheckoutForm />} />
          <Route path="/return" element={<Return />} />
          <Route path="*" element={<Navigate to="/checkout" />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App;