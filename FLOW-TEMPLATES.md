# Flow Templates Documentation

This document describes each flow template available in the Klaviyo Flow Builder.

---

## 1. Abandoned Cart

**Trigger:** Added to Cart

**Entry Filters:**
- Has NOT started checkout since flow start
- Has NOT placed order since flow start
- NOT in this flow in last 4 days

**Structure:**
- Conditional split: First-time buyers vs Repeat customers (based on Ordered Product count = 0 all-time)
- Each branch gets 3 emails

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 40 minutes |
| Email 2 | 20 hours |
| Email 3 | 1 day |

**Total Emails:** 6 (3 per branch)

---

## 2. Abandoned Checkout

**Trigger:** Started Checkout (Checkout Started)

**Entry Filters:**
- Has NOT placed order since flow start
- NOT in this flow in last 4 days

**Structure:**
- Split 1: First-time buyers (prospects) vs Existing customers
- Split 2 (customers only): Checkout value > $149 (free shipping eligible) vs Standard
- Three branches total: Prospects, Free Shipping, Standard

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 30 minutes |
| Email 2 | 23 hours |
| Email 3 | 23 hours |

**Total Emails:** 9 (3 per branch)

---

## 3. Browse Abandonment

**Trigger:** Active on Site

**Entry Filters:**
- Has NOT started checkout since flow start
- Has NOT placed order since flow start
- Has NOT added to cart since flow start
- Has NOT viewed product since flow start
- NOT in this flow in last 14 days

**Structure:**
- Conditional split: Prospects (never ordered) vs Customers
- Each branch gets 2 emails

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 40 minutes |
| Email 2 | 20 hours |

**Total Emails:** 4 (2 per branch)

---

## 4. Site Abandonment

**Trigger:** Active on Site

**Entry Filters:**
- HAS viewed product since flow start (greater than 0)
- HAS added to cart since flow start (greater than 0)
- HAS started checkout all-time (greater than 0)
- NOT in this flow in last 15 days

**Structure:**
- 50/50 A/B test split
- Each branch gets 1 email with different timing

**Timing:**
| Branch | Delay |
|--------|-------|
| Branch A | 20 minutes |
| Branch B | 2 hours |

**Total Emails:** 2 (1 per branch)

---

## 5. Post-Purchase Thank You

**Trigger:** Placed Order

**Entry Filters:**
- NOT in this flow in last 7 days

**Structure:**
- Conditional split: First-time buyers (order count = 1) vs Repeat customers
- First-time buyers: 4 emails
- Repeat customers: 3 emails

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 20 minutes |
| Email 2 | 1 day |
| Email 3 | 2 days |
| Email 4 (first-time only) | 2 days |

**Total Emails:** 7 (4 first-time + 3 repeat)

---

## 6. Upsell / Cross-sell

**Trigger:** Placed Order

**Entry Filters:**
- Has NOT placed order since flow start
- NOT in this flow in last 21 days

**Structure:**
- Linear flow (no splits)
- 3 emails

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 7 days |
| Email 2 | 3 days |
| Email 3 | 3 days |

**Total Emails:** 3

---

## 7. Customer Winback

**Trigger:** Placed Order

**Entry Filters:**
- Has NOT placed order since flow start

**Structure:**
- Linear flow (no splits)
- 3 emails
- Smart Sending enabled

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | 90 days |
| Email 2 | 3 days |
| Email 3 | 4 days |

**Total Emails:** 3

---

## 8. Welcome Series

**Trigger:** Added to List

**Entry Filters:**
- Has NOT placed order since flow start

**Structure:**
- Linear flow (no splits)
- 4 emails

**Timing:**
| Email | Delay |
|-------|-------|
| Email 1 | Immediate |
| Email 2 | 2 days |
| Email 3 | 2 days |
| Email 4 | 2 days |

**Total Emails:** 4

**Note:** List trigger is stripped during deployment. You must manually add a list trigger after the flow is created.

---

## Metric Mapping

These flows use the following Klaviyo metrics (automatically mapped during deployment):

| Metric Name | Used In |
|-------------|---------|
| Added to Cart | Abandoned Cart trigger |
| Placed Order | Post-Purchase, Upsell, Winback triggers + filters |
| Checkout Started / Started Checkout | Abandoned Checkout trigger + filters |
| Ordered Product | Customer vs Prospect splits |
| Active on Site | Browse Abandonment, Site Abandonment triggers |
| Viewed Product | Site Abandonment filters |

---

## Deployment Notes

1. **Sender Info:** Automatically populated from your Klaviyo account's default sender settings
2. **Metrics:** Automatically mapped to your account's metric IDs by name
3. **Status:** All flows deploy in Draft status - review and activate manually
4. **Templates:** Email content is blank - add your own templates/content after deployment
5. **List Triggers:** Welcome Series requires manual list selection after deployment
