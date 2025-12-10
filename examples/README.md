# Example Manifest Configurations

This directory contains production-ready example manifests for the BaaS Workers platform. You can use these files as a starting point for your own application.

## Usage

To use an example manifest:

1. Copy the content of the desired YAML file.
2. Paste it into your `apps/backend/src/config/manifest.yaml` (or convert to TypeScript object in `manifest.ts`).
3. Run migrations to create the necessary tables.

## Examples

### 1. Headless CMS (`manifest.cms.yaml`)

A fully-featured content management system for blogs, news sites, or corporate websites.

- **Entities:** BlogPost, Category, Author, Media, Comment
- **Features:** Rich text content, publishing workflow, media management, comment moderation.
- **Auth:** Editors and Admins.

### 2. E-commerce (`manifest.ecommerce.yaml`)

A complete backend for an online store or marketplace.

- **Entities:** Store, Product, Order, Cart, Customer
- **Features:** Inventory tracking, order management, shopping cart, multi-vendor support.
- **Auth:** Customers, Sellers, Admins.

### 3. SaaS Platform (`manifest.saas.yaml`)

A multi-tenant architecture for B2B SaaS applications.

- **Entities:** Workspace, TeamMember, Project, Document, Subscription
- **Features:** Tenant isolation, role-based access control (RBAC), subscription tiers.
- **Auth:** Email/Password, OAuth.

### 4. Social Network (`manifest.social.yaml`)

A backend for social media apps or community platforms.

- **Entities:** UserProfile, Post, Comment, Like, Follow, Notification
- **Features:** Feed generation, follower relationships, real-time notifications.
- **Auth:** Social login, JWT.

### 5. Minimal (`manifest.minimal.yaml`)

The simplest possible configuration for static sites or basic APIs.

- **Entities:** Page, Author
- **Features:** Public read/write access (configurable).
- **Auth:** Disabled.

## Secrets & Environment Variables

All examples assume the standard environment variables are set in `.dev.vars` (local) or Cloudflare Secrets (production):

- `JWT_SECRET`: Secret key for signing tokens (required if auth is enabled).
- `DB`: Cloudflare D1 Database binding.
- `KV`: Cloudflare KV Namespace binding.
- `R2`: Cloudflare R2 Bucket binding (if storage is enabled).
