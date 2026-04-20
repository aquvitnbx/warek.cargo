---
name: warekcargo-context
description: WarekCargo business context and operating model for discussions about WarekCargo, jastip Papua, hub Nabire, Nala CS, pricing, operations, technology stack (n8n, Wablas, AI CS), customer service workflows, and expansion planning. Use whenever the user mentions "WarekCargo", "jastip Papua", "hub Nabire", "Nala CS", or asks for strategy, systems, pricing, logistics, or operations tied to this Papua-focused cargo/jastip business.
---

# WarekCargo Context

Use this skill as the default source of truth for WarekCargo conversations.

## Business Summary

WarekCargo is a jasa titip and logistics coordination business that helps customers in Papua receive goods bought online from marketplaces like Tokopedia and Shopee at lower and more accessible shipping costs.

Core flow:
1. Customer buys goods online.
2. Seller ships to a WarekCargo hub in Jakarta, Surabaya, or Makassar.
3. Goods are consolidated and sorted by vessel or flight schedule in a batch system.
4. Goods are shipped to Nabire via cargo ship, passenger ship, or airplane.
5. Goods arrive at the Nabire agent location operated by Habib.
6. Customer picks up the item or pays separately for local delivery.

## Owner Profile

- Owner: Achmad Habib
- Preferred name: Habib
- Email: achmad.hbib@gmail.com
- Base location: Nabire, Papua
- Role: Owner-operator, active in field operations

## Operating Footprint

### Current focus
- Pilot city: Nabire
- Initial demand nodes mentioned: Nabire and Manokwari
- Warehousing or receiving hubs: Jakarta, Surabaya, Makassar
- Nabire agent site: Habib's ruko or home base
- Nabire team: 3+ people
- Hub operators: trusted family or close contacts

### Planned expansion
- Manokwari
- Sorong
- Jayapura
- Expand only after Nabire operations are stable

## Customer Value Proposition

Position WarekCargo as an access and consolidation service for Papua customers who need cheaper or more flexible delivery options from major Indonesian cities.

Primary advantage in Nabire:
- Competitors commonly offer only passenger-ship style pricing around Rp 15.000 to Rp 18.000 per kg.
- WarekCargo can offer a cheaper HEMAT option via cargo ship.

## Service Tiers

### Customer-facing services
- HEMAT
  - Mode: kapal kargo
  - ETA: 10 to 14 days
  - Price: Rp 10.000 to Rp 12.000 per kg
  - Margin target: around 50%
- CEPAT
  - Mode: kapal penumpang
  - ETA: 6 to 8 days
  - Price: Rp 15.000 to Rp 18.000 per kg
  - Margin target: around 15% to 30%
- EXPRESS
  - Mode: pesawat
  - ETA: 2 to 4 days
  - Price: above Rp 50.000 per kg
  - Margin: still to be determined
- Local delivery to customer home
  - Separate fee

## Hub Cost References

### Surabaya
- Kapal kargo: Rp 800.000 to Rp 950.000 per m3, ETA 10 to 14 days
- Kapal penumpang: Rp 2.400.000 per m3, ETA 6 to 8 days

### Jakarta
- Kapal kargo: Rp 900.000 per m3, ETA 10 to 14 days
- Kapal penumpang: Rp 2.600.000 per m3, ETA 6 to 8 days

### Makassar
- Needs further research

Assume hub prices are all-in through loading to vessel, with no extra fee to hub partners unless new information overrides this.

## Pricing Logic

Use these operating assumptions unless Habib changes them:
- Small or light goods: calculate by actual weight in kg.
- Large or voluminous goods: calculate by cubic volume (m3).
- Air freight: calculate by kg.
- Conversion baseline: 1 m3 is approximately 200 kg.

When proposing pricing or automation rules, account for both weight-based and volume-based charging.

## Batch Shipping System

Model WarekCargo operations as a scheduled batch logistics business, not instant dispatch.

Typical cargo-ship batch timeline:
- Monday to Thursday: customers send or route goods to the hub
- Friday: cut-off for the coming batch
- Sunday: ETD, ship departs from Surabaya or Jakarta
- Plus 10 to 14 days: arrival in Nabire
- Plus 1 to 2 days: port retrieval and local sorting
- Plus 1 to 3 days: customer pickup or last-mile delivery

In customer messaging, set expectations clearly around cut-off dates, ETD, ETA, and batch-based movement.

## Technology Stack

Use this as the default technology context unless Habib revises it:
- Automation: n8n, self-hosted
- Database: PostgreSQL, database name `warekcargo_db`
- VPS provider: Biznet NEO
- VPS IP: 103.129.148.83
- VPS machine name: CEOAquvit
- n8n URL: http://103.129.148.83:5678
- WhatsApp gateway: Wablas
- AI CS persona: Nala
- AI backend plan: Claude API
- POS or management layer: OpenClaw

## Nala CS Role

Treat Nala as the AI customer-service brain for WarekCargo, especially on WhatsApp Business.

Expected responsibilities:
- Answer price and ETA questions
- Register new shipments or customer requests
- Check shipment status
- Explain batch schedules and next cut-off
- Coordinate with local agents or operations staff
- Support 24 or 7 style responsiveness, with human handoff when needed

When writing CS flows, keep language warm, clear, trustworthy, and easy for Papua customers to understand.

## Planning Guidance

When helping Habib with WarekCargo:
- Optimize for simple field execution, not fancy theory.
- Prefer SOPs, scripts, pricing formulas, customer templates, and clear process maps.
- Keep Nabire as the operational center unless Habib asks to expand scope.
- Reflect that the business combines jastip, consolidation, and regional cargo coordination.
- Distinguish carefully between hub-to-Nabire transport and Nabire-to-customer local delivery.
- When discussing margins, compare against hub costs and competitor pricing in Nabire.
- When discussing systems, assume WhatsApp is the main customer interface.

## Response Defaults

In WarekCargo discussions, default to:
- Indonesian language unless Habib asks otherwise
- concise, operator-friendly advice
- practical outputs such as templates, SOPs, scripts, tables converted to bullets if needed for chat delivery

If key assumptions are missing, ask only for the smallest missing detail needed to move forward.
