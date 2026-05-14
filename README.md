# GEMA Editorial

**Generadora de Escrituras y Manifiestos Artísticos**

A minimalist editorial publishing platform built with Next.js, featuring a digital and print bookstore.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Email:** Resend
- **Payments:** Stripe / MercadoPago
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Firebase project
- Resend account
- Stripe or MercadoPago account

### Installation

```bash
# Clone and install
git clone <repo-url>
cd gema-editorial
pnpm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables in .env.local

# Run development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
gema-editorial/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── catalogo/          # Book catalog
│   ├── checkout/          # Purchase flow
│   ├── libro/[slug]/      # Book detail pages
│   ├── manifiesto/        # Editorial philosophy
│   └── mi-biblioteca/     # User's digital library
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── books/            # Book-related components
│   ├── checkout/         # Checkout components
│   ├── email/            # Email templates
│   ├── layout/           # Layout components
│   └── ui/               # Base UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── server/actions/        # Server actions
├── types/                 # TypeScript types
└── config/               # Configuration files
```

## Features

### Public Site
- Editorial homepage with manifesto
- Book catalog with filters
- Individual book detail pages
- Shopping cart and checkout
- User authentication
- Digital library for purchased books

### Admin Dashboard
- Books management (CRUD)
- Order tracking
- Customer list
- Sales metrics and analytics

### Digital Delivery
- Secure download links
- Time-limited access (7 days)
- Download limits (5 per purchase)
- Email delivery with Resend

### Payments
- Abstracted payment layer
- Stripe integration
- MercadoPago integration
- Webhook handling

## Design Principles

- Minimalist, editorial aesthetic
- Strong typography
- Lots of whitespace
- Books displayed as gallery objects
- Subtle Framer Motion animations

## License

Private - GEMA Editorial
