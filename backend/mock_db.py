# Mock database for Agent Insight Engine
# Contains simulated merchant logs and documentation snippets
# Context: E-commerce platform transitioning from fully-hosted to headless architecture

# Merchant logs keyed by merchant_id
# Simulates real-world error logs from merchants migrating to headless e-commerce
logs = {
    # === LEGACY TICKETS (kept for backwards compatibility) ===
    "m_123": [
        "2024-01-15 10:23:45 ERROR: 403 Forbidden - API Key Invalid",
        "2024-01-15 10:23:46 WARN: Authentication failed for endpoint /api/v1/payments",
        "2024-01-15 10:23:47 INFO: Retry attempt 1 of 3",
        "2024-01-15 10:23:48 ERROR: 403 Forbidden - API Key Invalid (retry failed)",
    ],
    "m_456": [
        "2024-01-15 14:12:00 ERROR: 500 Internal Server Error - Database connection timeout",
        "2024-01-15 14:12:01 WARN: Connection pool exhausted",
        "2024-01-15 14:12:05 ERROR: Query execution failed: timeout after 30s",
    ],
    "m_789": [
        "2024-01-15 09:00:00 ERROR: 429 Too Many Requests - Rate limit exceeded",
        "2024-01-15 09:00:01 INFO: Current rate: 1050 req/min, Limit: 1000 req/min",
        "2024-01-15 09:00:02 WARN: Request queued for retry",
    ],
    "m_101": [
        "2024-01-15 16:45:00 ERROR: SSL Certificate verification failed",
        "2024-01-15 16:45:01 WARN: Webhook endpoint https://merchant.example.com/webhook returned SSL error",
        "2024-01-15 16:45:02 INFO: Falling back to retry queue",
    ],
    "m_202": [
        "2024-01-15 11:30:00 ERROR: Invalid JSON payload - Unexpected token",
        "2024-01-15 11:30:01 WARN: Request body parsing failed",
        "2024-01-15 11:30:01 DEBUG: Received payload: {amount: 100, currency: USD} (missing quotes)",
    ],
    "m_303": [
        "2024-01-15 08:15:00 INFO: Webhook delivery successful",
        "2024-01-15 08:15:01 INFO: Payment processed: $150.00",
        "2024-01-15 08:15:02 INFO: All systems operational",
    ],
    
    # === HEADLESS E-COMMERCE MIGRATION TICKETS ===
    
    # Storefront API - Products not displaying
    "m_ecom_001": [
        "2024-01-20 09:15:23 ERROR: GraphQL query failed - products field returned null",
        "2024-01-20 09:15:24 WARN: Storefront API token scope insufficient: read_products not granted",
        "2024-01-20 09:15:25 INFO: Falling back to REST API",
        "2024-01-20 09:15:26 ERROR: REST API returned 403 - Access denied for storefront channel",
    ],
    
    # Product variants not syncing
    "m_ecom_002": [
        "2024-01-20 11:30:00 WARN: Variant metafield mapping failed - legacy_variant_id not found",
        "2024-01-20 11:30:01 ERROR: Product sync incomplete - 156 variants missing parent SKU",
        "2024-01-20 11:30:02 DEBUG: Variant payload: {\"size\": null, \"color\": null, \"sku\": \"TSHIRT-001\"}",
    ],
    
    # Cart abandonment at checkout
    "m_ecom_003": [
        "2024-01-20 14:22:10 ERROR: Checkout session expired - cart_token invalid",
        "2024-01-20 14:22:11 WARN: Cross-origin cookie blocked: SameSite=Strict on checkout.domain.com",
        "2024-01-20 14:22:12 ERROR: Payment intent creation failed - no line items in session",
        "2024-01-20 14:22:13 INFO: Customer redirected to empty cart page",
    ],
    
    # Stripe webhooks not received
    "m_ecom_004": [
        "2024-01-20 16:45:00 ERROR: Webhook signature verification failed",
        "2024-01-20 16:45:01 WARN: Webhook endpoint returned 404 - /api/webhooks/stripe not found",
        "2024-01-20 16:45:02 INFO: Stripe retry attempt 3 of 5",
        "2024-01-20 16:45:10 ERROR: Webhook delivery failed after 5 retries",
    ],
    
    # Inventory mismatch
    "m_ecom_005": [
        "2024-01-20 08:00:00 WARN: Inventory sync delta detected - 847 SKUs out of sync",
        "2024-01-20 08:00:15 ERROR: ERP webhook timeout after 30s",
        "2024-01-20 08:01:00 INFO: Fallback to scheduled sync (every 15 min)",
        "2024-01-20 08:01:01 WARN: Last successful full sync: 6 hours ago",
    ],
    
    # Product import timeout
    "m_ecom_006": [
        "2024-01-20 10:30:00 INFO: Product import started - 15,247 items",
        "2024-01-20 10:32:45 WARN: Memory usage exceeded 80% threshold",
        "2024-01-20 10:35:00 ERROR: Import job timeout - processed 2,156 of 15,247",
        "2024-01-20 10:35:01 INFO: Partial rollback initiated",
    ],
    
    # Duplicate webhooks
    "m_ecom_007": [
        "2024-01-20 13:15:00 INFO: Webhook order.created fired for order #10045",
        "2024-01-20 13:15:01 INFO: Webhook order.created fired for order #10045 (duplicate)",
        "2024-01-20 13:15:01 INFO: Webhook order.created fired for order #10045 (duplicate)",
        "2024-01-20 13:15:02 WARN: Idempotency key not provided in webhook handler",
        "2024-01-20 13:15:02 ERROR: Duplicate fulfillment request rejected by warehouse API",
    ],
    
    # Webhook SSL failure
    "m_ecom_008": [
        "2024-01-20 15:00:00 ERROR: SSL handshake failed - certificate chain incomplete",
        "2024-01-20 15:00:01 WARN: Intermediate certificate missing from chain",
        "2024-01-20 15:00:02 INFO: Webhook queued for retry (attempt 1/5)",
        "2024-01-20 15:00:32 ERROR: Connection timeout after 30s",
    ],
    
    # Slow API response
    "m_ecom_009": [
        "2024-01-20 12:00:00 WARN: Storefront API latency: 5,234ms (threshold: 500ms)",
        "2024-01-20 12:00:01 INFO: Cache MISS for products_collection_summer",
        "2024-01-20 12:00:02 DEBUG: GraphQL query complexity: 847 (limit: 1000)",
        "2024-01-20 12:00:03 WARN: No CDN cache headers detected on response",
    ],
    
    # CDN cache stale
    "m_ecom_010": [
        "2024-01-20 14:00:00 INFO: Product SKU-12345 price updated: $49.99 → $39.99",
        "2024-01-20 14:00:01 INFO: Cache invalidation request sent to CDN",
        "2024-01-20 14:00:02 WARN: CDN purge returned 202 Accepted (async processing)",
        "2024-01-20 14:30:00 ERROR: Stale content detected - ISR revalidation not triggered",
    ],
    
    # Login session not persisting
    "m_ecom_011": [
        "2024-01-20 11:00:00 INFO: Customer auth successful - token issued",
        "2024-01-20 11:00:01 WARN: Authorization header missing on subsequent request",
        "2024-01-20 11:00:02 ERROR: JWT validation failed - token not provided",
        "2024-01-20 11:00:02 DEBUG: Cookie storage check: localStorage disabled by browser policy",
    ],
    
    # SSO broken
    "m_ecom_012": [
        "2024-01-20 09:45:00 ERROR: OAuth redirect_uri mismatch - expected old-store.com, got new-headless.com",
        "2024-01-20 09:45:01 WARN: CORS preflight failed for SSO endpoint",
        "2024-01-20 09:45:02 INFO: Fallback to standard login flow",
    ],
    
    # CMS content not rendering
    "m_ecom_013": [
        "2024-01-20 10:15:00 WARN: Rich text field contains unsanitized HTML",
        "2024-01-20 10:15:01 ERROR: Content render failed - dangerouslySetInnerHTML blocked by CSP",
        "2024-01-20 10:15:02 DEBUG: Raw content returned instead of parsed blocks",
    ],
    
    # Broken image URLs
    "m_ecom_014": [
        "2024-01-20 08:30:00 ERROR: Image fetch failed - 404 Not Found",
        "2024-01-20 08:30:00 DEBUG: URL: cdn.shopify.com/s/files/1/old-store/products/img123.jpg",
        "2024-01-20 08:30:01 WARN: Image URL rewrite rule not applied",
        "2024-01-20 08:30:02 INFO: 3,456 images pending migration from legacy CDN",
    ],
    
    # Orders not syncing to fulfillment
    "m_ecom_015": [
        "2024-01-20 07:00:00 INFO: Order #10089 created on headless storefront",
        "2024-01-20 07:00:01 ERROR: Fulfillment API connection failed - endpoint unreachable",
        "2024-01-20 07:00:02 WARN: Order queued for retry (position: 75)",
        "2024-01-20 07:00:03 ERROR: ShipStation OAuth token expired",
    ],
    
    # Refund processing failing
    "m_ecom_016": [
        "2024-01-20 16:00:00 INFO: Refund initiated for order #10023 - amount: $149.99",
        "2024-01-20 16:00:01 ERROR: Payment gateway API version mismatch",
        "2024-01-20 16:00:02 WARN: Legacy refund endpoint deprecated, use /v2/refunds",
        "2024-01-20 16:00:03 ERROR: Refund failed - original charge ID format incompatible",
    ],
}

# Documentation snippets for RAG-style search
# These simulate internal knowledge base articles for headless e-commerce migration
docs = [
    # === LEGACY DOCS (kept for backwards compatibility) ===
    
    # API Key issues
    """## API Key Troubleshooting Guide
    If you receive a 403 Forbidden error with "API Key Invalid":
    1. Verify the API key hasn't expired (keys expire after 90 days)
    2. Check if the key has been regenerated in the dashboard
    3. Ensure the key is being sent in the correct header: `Authorization: Bearer <key>`
    4. For sandbox vs production: ensure you're using the correct environment key
    
    Resolution: Navigate to Dashboard > Settings > API Keys to regenerate.""",
    
    # Rate limiting
    """## Rate Limiting Policy
    Our API enforces the following rate limits:
    - Standard tier: 1000 requests/minute
    - Premium tier: 5000 requests/minute
    - Enterprise tier: Unlimited (fair use policy)
    
    When you hit a rate limit (HTTP 429), implement exponential backoff:
    - Wait 1 second, then retry
    - If still limited, wait 2 seconds, then 4, then 8 (max 60 seconds)
    
    Contact support to upgrade your tier if needed.""",
    
    # Database issues
    """## Database Connection Troubleshooting
    HTTP 500 errors related to database connections can occur due to:
    1. Connection pool exhaustion - increase pool size in configuration
    2. Long-running queries - optimize queries or increase timeout
    3. Network latency - check VPC/firewall settings
    
    Quick fix: Restart the affected service to reset connections.
    Long-term: Review connection pool settings and query performance.""",
    
    # SSL/Webhook issues
    """## Webhook SSL Configuration
    Webhook endpoints must have valid SSL certificates:
    - Certificate must not be self-signed (in production)
    - Certificate chain must be complete
    - Certificate must not be expired
    
    To test: `curl -I https://your-webhook-endpoint.com`
    
    If using Let's Encrypt, ensure auto-renewal is configured.
    Temporary workaround: Enable "Skip SSL Verification" in webhook settings (not recommended for production).""",
    
    # JSON parsing
    """## API Request Format Guide
    All API requests must use valid JSON:
    - Property names must be quoted: {"amount": 100} not {amount: 100}
    - Use double quotes, not single quotes
    - Numbers and booleans are unquoted
    - Content-Type header must be: application/json
    
    Example valid payload:
    ```json
    {
        "amount": 10000,
        "currency": "USD",
        "description": "Order #12345"
    }
    ```""",
    
    # Migration guide
    """## API v2 Migration Guide
    When migrating from API v1 to v2:
    1. Update base URL from api.example.com/v1 to api.example.com/v2
    2. Authentication header changed: X-API-Key → Authorization: Bearer
    3. Response format now includes metadata wrapper
    4. Deprecated endpoints: /charge (use /payments/create instead)
    
    Migration deadline: March 31, 2024
    Contact developer support for migration assistance.""",
    
    # === HEADLESS E-COMMERCE MIGRATION DOCS ===
    
    # Storefront API Setup
    """## Storefront API Configuration for Headless
    When migrating to a headless storefront, ensure your API token has correct scopes:
    
    Required scopes for product access:
    - `read_products` - View products and collections
    - `read_product_listings` - Access published product data
    - `read_inventory` - Check stock levels
    
    To fix "403 Access denied for storefront channel":
    1. Go to Dashboard > Sales Channels > Headless
    2. Ensure your storefront is added as a sales channel
    3. Regenerate the Storefront API token with correct scopes
    4. Products must be published to the headless channel
    
    Common mistake: Products published to "Online Store" channel are NOT automatically available to headless storefronts.""",
    
    # Variant Sync Issues
    """## Product Variant Sync Troubleshooting
    When variants show as "undefined" or fail to sync:
    
    Root causes:
    1. Legacy variant IDs don't map to new SKU format
    2. Parent product SKU missing from variant records
    3. Metafield mappings not configured for custom attributes
    
    Resolution steps:
    1. Export variants with legacy IDs: `GET /api/products/variants?include=legacy_ids`
    2. Create mapping table: legacy_variant_id → new_sku
    3. Re-run sync with mapping: `POST /api/sync/variants` with mapping payload
    4. For custom attributes (size, color), configure metafield mappings in Settings > Metafields
    
    Prevention: Always include `parent_sku` when creating variants via API.""",
    
    # Checkout Session Management
    """## Headless Checkout Session Management
    Cart abandonment at payment step is usually caused by session/cookie issues.
    
    Common causes:
    1. **SameSite cookie policy**: Cookies blocked across domains
    2. **Session token expiry**: Default 15 min timeout too short
    3. **Missing CORS headers**: Preflight requests blocked
    
    Solutions:
    1. Set cookies with `SameSite=None; Secure` for cross-domain checkout
    2. Extend session timeout: `checkout.session.timeout = 3600` (1 hour)
    3. Add checkout domain to CORS whitelist in API settings
    4. Use server-side session storage instead of cookies for sensitive data
    
    For Next.js/Vercel: Use `getServerSideProps` to maintain session across domains.
    
    Test with: `curl -I -X OPTIONS https://checkout.domain.com --header "Origin: https://storefront.com"`""",
    
    # Stripe Webhook Configuration
    """## Stripe Webhook Setup for Headless Architecture
    Webhooks failing after headless migration? Check these:
    
    **404 Not Found - endpoint not found**:
    - Old endpoint: `/webhooks/stripe` (hosted platform)
    - New endpoint: `/api/webhooks/stripe` (Next.js API route)
    - Update webhook URL in Stripe Dashboard > Developers > Webhooks
    
    **Signature verification failed**:
    - Webhook signing secret changed - get new one from Stripe Dashboard
    - Ensure raw body is used for verification (not parsed JSON)
    - For Next.js: disable body parser for webhook route
    
    ```javascript
    // pages/api/webhooks/stripe.js
    export const config = { api: { bodyParser: false } };
    ```
    
    **Test webhooks locally**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`""",
    
    # Inventory Sync
    """## Inventory Sync Between Headless Storefront and ERP
    Inventory mismatches cause overselling. Here's how to fix:
    
    **Real-time sync (recommended)**:
    - Configure ERP webhooks to fire on stock changes
    - Webhook URL: `POST /api/inventory/webhook`
    - Include: `sku`, `quantity`, `location_id`, `timestamp`
    
    **Fallback scheduled sync**:
    - If webhooks timeout, system falls back to 15-min scheduled sync
    - This can cause up to 15 min of stale inventory data
    
    **To investigate sync issues**:
    1. Check last successful sync: `GET /api/inventory/sync/status`
    2. View sync delta: `GET /api/inventory/delta?threshold=10`
    3. Force full sync: `POST /api/inventory/sync/full`
    
    **Prevention**:
    - Set up inventory buffer: reserve 5-10% stock as safety margin
    - Enable oversell prevention: Settings > Inventory > Block overselling""",
    
    # Bulk Import
    """## Large Product Catalog Import Guide
    Importing 10,000+ products? Follow these best practices:
    
    **Why imports timeout**:
    - Memory limits exceeded (default 512MB)
    - Single-threaded processing too slow
    - No checkpoint/resume capability
    
    **Recommended approach**:
    1. Split CSV into batches of 1,000 products
    2. Use async import API: `POST /api/import/products/async`
    3. Monitor progress: `GET /api/import/jobs/{job_id}`
    4. Failed items saved for retry: `GET /api/import/jobs/{job_id}/failures`
    
    **For Magento migrations**:
    - Use our Magento export tool: `magento-export --format=headless`
    - Handles variant/configurable product conversion
    - Maps Magento attributes to metafields automatically
    
    Rate limit: 100 products/second for async imports""",
    
    # Webhook Idempotency
    """## Preventing Duplicate Webhook Processing
    Duplicate webhooks cause duplicate orders, emails, and fulfillment requests.
    
    **Why duplicates happen**:
    - Network timeouts trigger retries
    - No idempotency key in handler
    - Webhook fires before previous one acknowledged
    
    **Solution: Implement idempotency**:
    ```python
    def handle_webhook(event):
        idempotency_key = event['id']  # Use webhook event ID
        if redis.get(f"webhook:{idempotency_key}"):
            return {"status": "already_processed"}
        
        # Process webhook...
        redis.setex(f"webhook:{idempotency_key}", 86400, "processed")
    ```
    
    **Best practices**:
    - Store processed webhook IDs for 24 hours
    - Return 200 OK quickly, process async
    - Use database transactions for critical operations""",
    
    # SSL Certificate Chain
    """## Webhook SSL Certificate Troubleshooting
    "SSL handshake failed" or "certificate chain incomplete" errors:
    
    **Diagnosis**:
    ```bash
    openssl s_client -connect your-webhook.com:443 -servername your-webhook.com
    ```
    Look for: "Verify return code: 0 (ok)"
    
    **Common issues**:
    1. Intermediate certificate missing - server only has leaf cert
    2. Certificate expired - check expiry date
    3. Self-signed certificate - not allowed in production
    
    **For Vercel/Netlify deployments**:
    - SSL is automatic and should work
    - If failing, check custom domain DNS configuration
    - Ensure CNAME points to platform's SSL-enabled endpoint
    
    **Quick fix**: Download full certificate chain from your CA and install all certs""",
    
    # API Performance
    """## Storefront API Performance Optimization
    Slow API responses (>500ms) impact conversion rates.
    
    **Caching strategies**:
    1. **CDN caching**: Set `Cache-Control: public, max-age=300` on product responses
    2. **ISR (Incremental Static Regeneration)**: For Next.js, use `revalidate: 60`
    3. **Edge caching**: Use Vercel Edge or Cloudflare Workers
    
    **GraphQL optimization**:
    - Reduce query complexity (check with `X-Query-Complexity` header)
    - Request only needed fields (no `SELECT *` equivalent)
    - Use persisted queries for production
    
    **Monitoring**:
    - Add `X-Response-Time` header tracking
    - Set up alerts for p99 > 500ms
    - Use APM tools (DataDog, New Relic) for bottleneck identification
    
    Target: p95 latency < 200ms for product listing APIs""",
    
    # CDN Cache Invalidation
    """## CDN Cache Invalidation for Headless Commerce
    Stale content after product updates? Configure cache invalidation:
    
    **Automatic invalidation**:
    1. Enable webhooks: product.updated, product.created, product.deleted
    2. Webhook handler calls CDN purge API
    3. For Cloudflare: `POST /zones/{zone_id}/purge_cache`
    4. For Vercel: `POST /api/revalidate?path=/products/{slug}`
    
    **Next.js ISR revalidation**:
    ```javascript
    // pages/api/revalidate.js
    export default async function handler(req, res) {
        await res.revalidate(`/products/${req.body.slug}`);
        return res.json({ revalidated: true });
    }
    ```
    
    **Gotchas**:
    - CDN purge is async (202 response) - content may be stale for 1-5 min
    - Purge by tag is more efficient than URL for bulk updates
    - Always set reasonable TTL (5-15 min) as fallback""",
    
    # Authentication & Sessions
    """## Customer Authentication in Headless Architecture
    Sessions not persisting across pages? Here's what to check:
    
    **Token storage options**:
    1. **httpOnly cookies** (recommended) - secure, automatic on requests
    2. **localStorage** - persists, but blocked by some browsers/policies
    3. **sessionStorage** - cleared on tab close, not ideal
    
    **Why tokens disappear**:
    - localStorage disabled by privacy settings/extensions
    - Missing `Authorization` header on API calls
    - Token not saved after initial auth response
    
    **Implementation for Next.js**:
    ```javascript
    // Use cookies instead of localStorage
    import { setCookie, getCookie } from 'cookies-next';
    
    // After login:
    setCookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
    
    // On each request:
    const token = getCookie('auth_token');
    fetch('/api/account', { headers: { Authorization: `Bearer ${token}` }});
    ```
    
    **For SSO**: Update OAuth redirect_uri to new headless domain in identity provider settings""",
    
    # CMS Content Rendering
    """## Headless CMS Content Rendering Issues
    Rich text showing as raw HTML or not rendering?
    
    **Content Security Policy (CSP) blocks**:
    - `dangerouslySetInnerHTML` blocked by default CSP
    - Solution: Use a rich text renderer library
    
    **For Contentful**:
    ```javascript
    import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
    // Renders structured content safely
    {documentToReactComponents(content.fields.body)}
    ```
    
    **For Sanity**:
    ```javascript
    import { PortableText } from '@portabletext/react';
    // Renders Sanity's portable text format
    <PortableText value={content.body} />
    ```
    
    **Common mistakes**:
    - Storing HTML strings instead of structured content
    - Not sanitizing user-generated content
    - Missing CSS for rendered elements (h1, p, ul styles)""",
    
    # Image Migration
    """## Migrating Images from Hosted Platform to Headless
    Broken images after migration? Images still on old CDN:
    
    **Migration steps**:
    1. Export image URLs from legacy platform
    2. Download all images: `wget -i image-urls.txt`
    3. Upload to new CDN/storage (Cloudinary, S3, Vercel Blob)
    4. Update product records with new URLs
    
    **URL rewrite approach** (faster):
    - Keep old images temporarily accessible
    - Configure URL rewrite rule: old-cdn.com/* → new-cdn.com/*
    - Gradually migrate images in background
    
    **For Shopify migrations**:
    - Shopify CDN URLs remain accessible after store closure
    - But: Add cdn.shopify.com to CSP `img-src` directive
    - Long-term: Migrate all images to avoid dependency
    
    Batch migration API: `POST /api/images/migrate` with source URLs""",
    
    # Fulfillment Integration
    """## Order Fulfillment Integration for Headless
    Orders not reaching ShipStation/fulfillment system?
    
    **Check OAuth token**:
    ```bash
    curl -H "Authorization: Bearer {token}" https://api.shipstation.com/orders
    ```
    If 401: Token expired, re-authenticate in Settings > Integrations > ShipStation
    
    **Webhook vs Polling**:
    - Webhook (recommended): Real-time, configure order.created webhook
    - Polling: ShipStation checks every 15 min, delays possible
    
    **Troubleshooting queue**:
    1. View queued orders: `GET /api/fulfillment/queue`
    2. Retry failed orders: `POST /api/fulfillment/retry`
    3. Check integration status: `GET /api/integrations/shipstation/status`
    
    **Common issues**:
    - Fulfillment endpoint changed during migration
    - Network/firewall blocking outbound requests to ShipStation
    - Order format incompatible (legacy order IDs vs new format)""",
    
    # Payment Gateway Migration
    """## Payment Gateway Migration for Headless
    Refunds failing? Payment API version mismatch?
    
    **API version compatibility**:
    - Legacy charges use `/v1/charges/{id}/refunds`
    - New orders use `/v2/payment_intents/{id}/refund`
    - Check charge ID format: `ch_` (legacy) vs `pi_` (new)
    
    **Handling legacy refunds**:
    ```python
    def process_refund(order):
        if order.charge_id.startswith('ch_'):
            # Legacy charge
            return stripe.Refund.create(charge=order.charge_id)
        else:
            # Payment Intent
            return stripe.PaymentIntent.cancel(order.charge_id)
    ```
    
    **Migration checklist**:
    - [ ] Update Stripe SDK to latest version
    - [ ] Map legacy charge IDs to payment intents where possible
    - [ ] Test refund flow in sandbox before production
    - [ ] Configure new webhook endpoints for refund events
    
    Stripe migration guide: https://stripe.com/docs/payments/payment-intents/migration""",
]

# Helper function to get logs for a merchant
def get_merchant_logs(merchant_id: str) -> list[str]:
    """Retrieve logs for a specific merchant ID. Handles various ID formats."""
    if not merchant_id:
        return []
    
    # Normalize the merchant ID
    merchant_id = merchant_id.strip().lower()
    
    # Direct match
    if merchant_id in logs:
        return logs[merchant_id]
    
    # Try with m_ prefix if not present
    if not merchant_id.startswith("m_"):
        prefixed_id = f"m_{merchant_id}"
        if prefixed_id in logs:
            return logs[prefixed_id]
    
    # Try without m_ prefix if present
    if merchant_id.startswith("m_"):
        unprefixed_id = merchant_id[2:]
        for key in logs:
            if key.endswith(unprefixed_id):
                return logs[key]
    
    # Partial match (e.g., "123" matches "m_123")
    for key in logs:
        if merchant_id in key or key in merchant_id:
            return logs[key]
    
    return []

# Helper function to search docs by keyword
def search_docs(query: str) -> list[str]:
    """Simple keyword-based document search."""
    query_lower = query.lower()
    results = []
    for doc in docs:
        if query_lower in doc.lower():
            results.append(doc)
    return results
