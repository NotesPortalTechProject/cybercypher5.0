# Mock Support Tickets - E-Commerce Headless Migration

> **Context**: These tickets simulate a merchant transitioning from a fully-hosted e-commerce platform (like Shopify/BigCommerce) to a headless architecture with a custom React/Next.js storefront, headless CMS, and API-driven backend.

---

## Ticket Categories

1. [Storefront API Issues](#storefront-api-issues)
2. [Checkout & Payment Issues](#checkout--payment-issues)
3. [Inventory & Product Sync](#inventory--product-sync)
4. [Webhook & Event Issues](#webhook--event-issues)
5. [Performance & Caching](#performance--caching)
6. [Authentication & Sessions](#authentication--sessions)
7. [Content Management](#content-management)
8. [Order Management](#order-management)

---

## Storefront API Issues

### Ticket #001 - Products Not Displaying on Headless Storefront
**Merchant ID:** `m_ecom_001`  
**Priority:** Critical  
**Status:** Open

**Description:**  
After migrating to our new Next.js storefront, product listings are returning empty arrays. The old hosted store shows 450+ products, but our Storefront API calls return `{"products": [], "total": 0}`.

**Customer Message:**  
> "We launched our new headless site last night and none of our products are showing up! Our old Shopify store still has everything. We're losing thousands in sales every hour. Please help ASAP!"

**Error Logs:**
```
2024-01-20 09:15:23 ERROR: GraphQL query failed - products field returned null
2024-01-20 09:15:24 WARN: Storefront API token scope insufficient: read_products not granted
2024-01-20 09:15:25 INFO: Falling back to REST API
2024-01-20 09:15:26 ERROR: REST API returned 403 - Access denied for storefront channel
```

---

### Ticket #002 - Product Variants Not Syncing
**Merchant ID:** `m_ecom_002`  
**Priority:** High  
**Status:** Open

**Description:**  
Product variants (sizes, colors) are not appearing correctly on the headless frontend. Base products sync fine, but variants show as "undefined" or missing entirely.

**Customer Message:**  
> "Customers are complaining they can't select sizes for our clothing items. The dropdown just shows 'undefined' for all options. This worked fine on our old BigCommerce store."

**Error Logs:**
```
2024-01-20 11:30:00 WARN: Variant metafield mapping failed - legacy_variant_id not found
2024-01-20 11:30:01 ERROR: Product sync incomplete - 156 variants missing parent SKU
2024-01-20 11:30:02 DEBUG: Variant payload: {"size": null, "color": null, "sku": "TSHIRT-001"}
```

---

## Checkout & Payment Issues

### Ticket #003 - Cart Abandonment at Payment Step
**Merchant ID:** `m_ecom_003`  
**Priority:** Critical  
**Status:** Open

**Description:**  
Customers are abandoning carts at the payment step. Checkout flow breaks when transitioning from headless cart to payment gateway. Cart session is being lost.

**Customer Message:**  
> "We've had 200+ abandoned carts today! Customers add items, click checkout, and then the cart empties when they try to pay. Our conversion rate dropped from 3.2% to 0.1% overnight."

**Error Logs:**
```
2024-01-20 14:22:10 ERROR: Checkout session expired - cart_token invalid
2024-01-20 14:22:11 WARN: Cross-origin cookie blocked: SameSite=Strict on checkout.domain.com
2024-01-20 14:22:12 ERROR: Payment intent creation failed - no line items in session
2024-01-20 14:22:13 INFO: Customer redirected to empty cart page
```

---

### Ticket #004 - Stripe Webhook Not Receiving Events
**Merchant ID:** `m_ecom_004`  
**Priority:** High  
**Status:** Open

**Description:**  
After switching to headless, Stripe webhooks are not being received. Orders are being placed but not marked as paid in the system.

**Customer Message:**  
> "Orders are stuck in 'pending payment' status even though Stripe shows the charges went through. We have to manually mark each order as paid. This is unsustainable."

**Error Logs:**
```
2024-01-20 16:45:00 ERROR: Webhook signature verification failed
2024-01-20 16:45:01 WARN: Webhook endpoint returned 404 - /api/webhooks/stripe not found
2024-01-20 16:45:02 INFO: Stripe retry attempt 3 of 5
2024-01-20 16:45:10 ERROR: Webhook delivery failed after 5 retries
```

---

## Inventory & Product Sync

### Ticket #005 - Inventory Count Mismatch Between Systems
**Merchant ID:** `m_ecom_005`  
**Priority:** High  
**Status:** Open

**Description:**  
Inventory levels are out of sync between the headless storefront and the legacy ERP system. Products showing in-stock on website are actually out of stock.

**Customer Message:**  
> "We've oversold 50 items this week because inventory isn't syncing. Customers order products we don't have, and we have to issue refunds. Our ERP shows correct stock but the website is wrong."

**Error Logs:**
```
2024-01-20 08:00:00 WARN: Inventory sync delta detected - 847 SKUs out of sync
2024-01-20 08:00:15 ERROR: ERP webhook timeout after 30s
2024-01-20 08:01:00 INFO: Fallback to scheduled sync (every 15 min)
2024-01-20 08:01:01 WARN: Last successful full sync: 6 hours ago
```

---

### Ticket #006 - Product Import Failing from Legacy System
**Merchant ID:** `m_ecom_006`  
**Priority:** Medium  
**Status:** Open

**Description:**  
Bulk product import from the old Magento store is failing. CSV upload times out and only partial products are imported.

**Customer Message:**  
> "We're trying to import our 15,000 product catalog from Magento but it keeps failing at around 2,000 products. We need all products migrated before we can go live."

**Error Logs:**
```
2024-01-20 10:30:00 INFO: Product import started - 15,247 items
2024-01-20 10:32:45 WARN: Memory usage exceeded 80% threshold
2024-01-20 10:35:00 ERROR: Import job timeout - processed 2,156 of 15,247
2024-01-20 10:35:01 INFO: Partial rollback initiated
```

---

## Webhook & Event Issues

### Ticket #007 - Order Webhooks Firing Multiple Times
**Merchant ID:** `m_ecom_007`  
**Priority:** High  
**Status:** Open

**Description:**  
Order creation webhooks are firing 3-4 times per order, causing duplicate entries in the fulfillment system and multiple confirmation emails to customers.

**Customer Message:**  
> "Customers are receiving 4 order confirmation emails for each order! Our warehouse is also seeing duplicate orders. This is embarrassing and confusing everyone."

**Error Logs:**
```
2024-01-20 13:15:00 INFO: Webhook order.created fired for order #10045
2024-01-20 13:15:01 INFO: Webhook order.created fired for order #10045 (duplicate)
2024-01-20 13:15:01 INFO: Webhook order.created fired for order #10045 (duplicate)
2024-01-20 13:15:02 WARN: Idempotency key not provided in webhook handler
2024-01-20 13:15:02 ERROR: Duplicate fulfillment request rejected by warehouse API
```

---

### Ticket #008 - Webhook Endpoint SSL Handshake Failure
**Merchant ID:** `m_ecom_008`  
**Priority:** Medium  
**Status:** Open

**Description:**  
Webhooks to the new headless backend are failing SSL handshake. The endpoint works in browser but webhooks timeout.

**Customer Message:**  
> "We set up our new webhook endpoint on Vercel but none of the webhooks are coming through. When we test the URL in browser it works fine."

**Error Logs:**
```
2024-01-20 15:00:00 ERROR: SSL handshake failed - certificate chain incomplete
2024-01-20 15:00:01 WARN: Intermediate certificate missing from chain
2024-01-20 15:00:02 INFO: Webhook queued for retry (attempt 1/5)
2024-01-20 15:00:32 ERROR: Connection timeout after 30s
```

---

## Performance & Caching

### Ticket #009 - Storefront API Response Time > 5 seconds
**Merchant ID:** `m_ecom_009`  
**Priority:** High  
**Status:** Open

**Description:**  
Product listing pages are taking 5+ seconds to load. The Storefront API is slow and there's no caching layer in place on the new headless frontend.

**Customer Message:**  
> "Our new site is so slow! Product pages take forever to load. Our old hosted store was instant. Customers are leaving before the page even finishes loading."

**Error Logs:**
```
2024-01-20 12:00:00 WARN: Storefront API latency: 5,234ms (threshold: 500ms)
2024-01-20 12:00:01 INFO: Cache MISS for products_collection_summer
2024-01-20 12:00:02 DEBUG: GraphQL query complexity: 847 (limit: 1000)
2024-01-20 12:00:03 WARN: No CDN cache headers detected on response
```

---

### Ticket #010 - CDN Cache Not Invalidating After Product Update
**Merchant ID:** `m_ecom_010`  
**Priority:** Medium  
**Status:** Open

**Description:**  
Product updates made in the headless CMS aren't reflecting on the live site. Old prices and descriptions still showing even after cache purge.

**Customer Message:**  
> "We updated the price of our best-seller 2 hours ago but customers still see the old price. We've tried purging Cloudflare cache but nothing works. Some customers are checking out at the wrong price."

**Error Logs:**
```
2024-01-20 14:00:00 INFO: Product SKU-12345 price updated: $49.99 → $39.99
2024-01-20 14:00:01 INFO: Cache invalidation request sent to CDN
2024-01-20 14:00:02 WARN: CDN purge returned 202 Accepted (async processing)
2024-01-20 14:30:00 ERROR: Stale content detected - ISR revalidation not triggered
```

---

## Authentication & Sessions

### Ticket #011 - Customer Login Session Not Persisting
**Merchant ID:** `m_ecom_011`  
**Priority:** High  
**Status:** Open

**Description:**  
Customers log in successfully but are immediately logged out when navigating to another page. Session tokens not persisting across the headless frontend.

**Customer Message:**  
> "Customers can't stay logged in! They log in, click to view their orders, and they're logged out again. This happens on every page change. Nobody can access their accounts."

**Error Logs:**
```
2024-01-20 11:00:00 INFO: Customer auth successful - token issued
2024-01-20 11:00:01 WARN: Authorization header missing on subsequent request
2024-01-20 11:00:02 ERROR: JWT validation failed - token not provided
2024-01-20 11:00:02 DEBUG: Cookie storage check: localStorage disabled by browser policy
```

---

### Ticket #012 - SSO Between Headless Store and Customer Portal Broken
**Merchant ID:** `m_ecom_012`  
**Priority:** Medium  
**Status:** Open

**Description:**  
Single sign-on between the new headless storefront and the existing customer portal no longer works. Customers have to log in twice.

**Customer Message:**  
> "Before the migration, customers could log into our store and automatically be logged into our support portal. Now they have to log in separately. It's confusing our B2B customers."

**Error Logs:**
```
2024-01-20 09:45:00 ERROR: OAuth redirect_uri mismatch - expected old-store.com, got new-headless.com
2024-01-20 09:45:01 WARN: CORS preflight failed for SSO endpoint
2024-01-20 09:45:02 INFO: Fallback to standard login flow
```

---

## Content Management

### Ticket #013 - Headless CMS Content Not Rendering
**Merchant ID:** `m_ecom_013`  
**Priority:** High  
**Status:** Open

**Description:**  
Rich content from Contentful/Sanity is not rendering on product pages. HTML blocks appear as raw code instead of formatted content.

**Customer Message:**  
> "Our product descriptions look terrible! All the formatting is gone and we see weird code like '<p>' and '<strong>' instead of actual formatted text. We spent weeks writing this content!"

**Error Logs:**
```
2024-01-20 10:15:00 WARN: Rich text field contains unsanitized HTML
2024-01-20 10:15:01 ERROR: Content render failed - dangerouslySetInnerHTML blocked by CSP
2024-01-20 10:15:02 DEBUG: Raw content returned instead of parsed blocks
```

---

### Ticket #014 - Image URLs Broken After CDN Migration
**Merchant ID:** `m_ecom_014`  
**Priority:** High  
**Status:** Open

**Description:**  
Product images returning 404 errors. Old image URLs from the hosted platform no longer resolve after migrating to new CDN.

**Customer Message:**  
> "Half our product images are broken! Some show and some don't. The broken ones all seem to be older products that were uploaded to our old Shopify store."

**Error Logs:**
```
2024-01-20 08:30:00 ERROR: Image fetch failed - 404 Not Found
2024-01-20 08:30:00 DEBUG: URL: cdn.shopify.com/s/files/1/old-store/products/img123.jpg
2024-01-20 08:30:01 WARN: Image URL rewrite rule not applied
2024-01-20 08:30:02 INFO: 3,456 images pending migration from legacy CDN
```

---

## Order Management

### Ticket #015 - Orders Not Syncing to Fulfillment System
**Merchant ID:** `m_ecom_015`  
**Priority:** Critical  
**Status:** Open

**Description:**  
New orders placed on the headless storefront aren't appearing in ShipStation/fulfillment system. Orders stuck in "processing" indefinitely.

**Customer Message:**  
> "We have 75 orders from the last 2 days that never made it to our warehouse! Customers are asking where their shipments are. Our fulfillment team sees nothing new in ShipStation."

**Error Logs:**
```
2024-01-20 07:00:00 INFO: Order #10089 created on headless storefront
2024-01-20 07:00:01 ERROR: Fulfillment API connection failed - endpoint unreachable
2024-01-20 07:00:02 WARN: Order queued for retry (position: 75)
2024-01-20 07:00:03 ERROR: ShipStation OAuth token expired
```

---

### Ticket #016 - Refund Processing Failing
**Merchant ID:** `m_ecom_016`  
**Priority:** High  
**Status:** Open

**Description:**  
Refunds initiated from the admin panel aren't processing through to the payment gateway. Customers not receiving refunds.

**Customer Message:**  
> "I've been trying to refund a customer for 3 days! I click refund in our admin, it says 'processing', but the customer never gets their money back and Stripe shows no refund attempt."

**Error Logs:**
```
2024-01-20 16:00:00 INFO: Refund initiated for order #10023 - amount: $149.99
2024-01-20 16:00:01 ERROR: Payment gateway API version mismatch
2024-01-20 16:00:02 WARN: Legacy refund endpoint deprecated, use /v2/refunds
2024-01-20 16:00:03 ERROR: Refund failed - original charge ID format incompatible
```

---

## Quick Reference - Merchant IDs

| Merchant ID | Issue Category | Severity |
|-------------|----------------|----------|
| m_ecom_001 | Storefront API - Products Empty | Critical |
| m_ecom_002 | Product Variants Not Syncing | High |
| m_ecom_003 | Cart Abandonment - Session Lost | Critical |
| m_ecom_004 | Stripe Webhooks Not Received | High |
| m_ecom_005 | Inventory Mismatch | High |
| m_ecom_006 | Product Import Timeout | Medium |
| m_ecom_007 | Duplicate Webhooks | High |
| m_ecom_008 | Webhook SSL Failure | Medium |
| m_ecom_009 | Slow API Response | High |
| m_ecom_010 | CDN Cache Stale | Medium |
| m_ecom_011 | Login Session Not Persisting | High |
| m_ecom_012 | SSO Broken | Medium |
| m_ecom_013 | CMS Content Not Rendering | High |
| m_ecom_014 | Broken Image URLs | High |
| m_ecom_015 | Orders Not Syncing to Fulfillment | Critical |
| m_ecom_016 | Refund Processing Failing | High |

---

## Testing the Agent

Use these prompts to test the agent with specific tickets:

1. **"My products aren't showing on the new site"** → Should identify API scope issues (m_ecom_001)
2. **"Customers can't select product sizes"** → Should identify variant sync issues (m_ecom_002)
3. **"Cart empties at checkout"** → Should identify session/cookie issues (m_ecom_003)
4. **"Orders stuck in pending payment"** → Should identify webhook configuration (m_ecom_004)
5. **"We oversold inventory"** → Should identify sync frequency issues (m_ecom_005)
6. **"Site is really slow"** → Should identify caching/performance issues (m_ecom_009)
7. **"Customers keep getting logged out"** → Should identify token storage issues (m_ecom_011)
8. **"Orders not going to warehouse"** → Should identify fulfillment API issues (m_ecom_015)
