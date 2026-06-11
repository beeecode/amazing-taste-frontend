# BelleFull

## Frontend Environment

The customer checkout flow calls backend endpoints for order creation and Paystack payment handling. The frontend does not connect directly to the database and must not contain Paystack secret keys.

Optional frontend variable:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

Leave `VITE_API_BASE_URL` empty for same-origin API calls such as `/api/orders`, `/api/paystack/initialize`, and `/api/paystack/verify/:reference`.

Backend-only secrets, including `PAYSTACK_SECRET_KEY`, belong on the server and must not be exposed in any `VITE_` variable.
