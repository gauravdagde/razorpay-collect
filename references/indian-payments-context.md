# Indian Payments Context

Reference for handling Indian payment specifics in Razorpay workflows.

## Currency

- Always INR. Razorpay does not support multi-currency for domestic payments.
- Amounts in **paise**: ₹1 = 100 paise.
- Minimum payment: ₹1 (100 paise).
- Format for display: ₹2,500.00 (use Indian numbering: lakhs and crores, not millions).
  - ₹1,00,000 = 1 lakh
  - ₹1,00,00,000 = 1 crore

## UPI

- UPI is the dominant payment method in India (~85% of digital transactions).
- UPI QR codes are the most frictionless collection method — scan and pay.
- UPI Collect flow is being deprecated by NPCI (Feb 2026 onwards). Prefer UPI Intent or QR.
- UPI AutoPay supports recurring mandates — customers authorize once, auto-debited monthly.
- UPI mandate max amount: ₹5,000 by default (can be customized).
- VPA format: username@bankhandle (e.g., ramesh@upi, ramesh@okicici).

## Phone Numbers

- Indian mobile numbers: 10 digits starting with 6/7/8/9.
- Always prefix with +91 for Razorpay API.
- If user provides "9876543210", convert to "+919876543210".
- If user provides "09876543210", strip leading 0 and prefix +91.

## GST

- GST (Goods and Services Tax) rates: 0%, 5%, 12%, 18%, 28%.
- Most services: 18%.
- Razorpay invoices support GST fields but they're optional.
- GSTIN format: 2-digit state code + 10-char PAN + 1 entity code + 1 check digit.
  Example: 27AAPFU0939F1ZV (Maharashtra entity).

## Common Collection Scenarios in India

### Society Maintenance
- Monthly collection from 50-500 flats.
- Typical amount: ₹1,500 — ₹10,000/month.
- Defaulter tracking is the #1 pain point.
- Payment links are ideal — send via WhatsApp, track status.

### Freelancer Invoicing
- Project-based or monthly retainer billing.
- Invoices with line items, sometimes with GST.
- Payment links for quick collection without formal invoices.

### SMB Vendor Payments
- One-off payments to vendors, contractors, delivery partners.
- UPI QR codes are the fastest — generate, share, done.

### Subscription/Membership Dues
- Gym, club, co-working space memberships.
- Razorpay Subscriptions + UPI AutoPay for recurring.

## Razorpay Test Mode

- Test key prefix: `rzp_test_`
- Live key prefix: `rzp_live_`
- Test mode: no real money moves. Safe for development and demos.
- Test card: 4111 1111 1111 1111, any future expiry, any CVV.
- Test UPI: success@razorpay (succeeds), failure@razorpay (fails).
- Test phone for OTP: any 10-digit number, OTP is always 1234.

## Settlements

- Razorpay settles to your bank account on T+2 (2 business days) by default.
- Instant settlements available (for a fee).
- Settlement currency: always INR to Indian bank accounts.