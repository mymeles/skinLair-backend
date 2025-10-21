# Refund Policy for SkinLair Spa Services

## 24-Hour Cancellation Policy

Our refund system is designed to be fair to both clients and the business while ensuring the esthetician's time is respected.

### Refund Tiers

| Time Before Appointment | Refund Amount | Policy |
|------------------------|---------------|---------|
| **24+ hours** | **100%** | Full refund - no questions asked |
| **12-24 hours** | **50%** | Partial refund - covers some preparation time |
| **2-12 hours** | **25%** | Minimal refund - last-minute cancellation |
| **Less than 2 hours** | **0%** | No refund - too late to fill the slot |

### How It Works

1. **Automatic Calculation**: The system automatically calculates refund amounts based on when the cancellation occurs
2. **Admin Override**: Administrators can override the policy for special circumstances
3. **Transparent Communication**: Clients see exactly what refund they're eligible for before confirming cancellation

### Special Circumstances (Esthetician Override)

The esthetician (Dr. Sarah Johnson) has full authority to override the refund policy for:

- **Medical Emergencies**: Full refund regardless of timing
- **Weather/Force Majeure**: Full refund for events beyond client control
- **Service Issues**: Full refund if the service was not delivered as promised
- **Client Hardship**: Compassionate override for difficult situations
- **Business Relationship**: Maintaining good client relationships
- **Any Special Circumstance**: Esthetician's professional judgment

### Implementation Details

#### API Endpoints

- `GET /admin/bookings/{id}/refund-check` - Check refund eligibility
- `POST /admin/bookings/{id}/refund` - Process refund with policy calculation

#### Refund Process

1. **Check Eligibility**: System calculates refund amount based on timing
2. **Display Policy**: Client/admin sees refund amount and policy explanation
3. **Process Refund**: If confirmed, refund is processed through payment system
4. **Update Records**: Booking status updated to "cancelled" with refund details

#### Esthetician Features

- **Policy Override**: Full authority to override refund policy
- **Compassionate Refunds**: Override for client hardship situations
- **Professional Discretion**: Use judgment for special circumstances
- **Refund Reason**: Track why refunds were issued
- **Policy Transparency**: Clear display of refund calculation

### Benefits

- **Fair to Clients**: Reasonable refund policy for legitimate cancellations
- **Protects Business**: Ensures esthetician time is compensated appropriately
- **Reduces Disputes**: Clear, automated policy reduces confusion
- **Esthetician Authority**: Dr. Sarah Johnson has full discretion to override policy
- **Compassionate Service**: Ability to help clients in difficult situations
- **Professional Judgment**: Trust the esthetician's expertise in client relationships

### Technical Implementation

The refund system integrates with:
- Booking management system
- Payment processing (Stripe)
- Admin dashboard
- Client notification system

All refunds are tracked and can be audited for business reporting.
