# WhatsApp Embedded Signup & Coexistence Setup Guide

This document details the WhatsApp Embedded Signup flow and its integration within this project workspace (`c:\Users\Shree\Desktop\whatappgateway`).

---

## 📋 Table of Contents
1. [Overview](#1-overview)
2. [Current Environment Configuration](#2-current-environment-configuration)
3. [System Architecture & Components](#3-system-architecture--components)
   - [Database Schema (MongoDB)](#database-schema-mongodb)
   - [Backend Routing & Controllers](#backend-routing--controllers)
   - [Meta Graph API Service Layer](#meta-graph-api-service-layer)
   - [Frontend User Interface](#frontend-user-interface)
4. [Step-by-Step Flow Execution](#4-step-by-step-flow-execution)
   - [Step 1: Onboarding Initiation](#step-1-onboarding-initiation)
   - [Step 2: Facebook Login & Flow Delegation](#step-2-facebook-login--flow-delegation)
   - [Step 3: Redirect Callback & Code Exchange](#step-3-redirect-callback--code-exchange)
   - [Step 4: Token Debugging & WABA Retrieval](#step-4-token-debugging--waba-retrieval)
   - [Step 5: Cloud API Onboarding & Coexistence Registration](#step-5-cloud-api-onboarding--coexistence-registration)
   - [Step 6: Connection State Persistence](#step-6-connection-state-persistence)
5. [Ngrok Tunnel & Webhooks Integration](#5-ngrok-tunnel--webhooks-integration)

---

## 1. Overview

**Meta WhatsApp Embedded Signup** allows the WhatsApp Gateway Dashboard to dynamically onboard a new phone number to the Meta WhatsApp Cloud API via a Facebook Login modal. 

Rather than requiring manual developer configuration (where users have to copy and paste phone IDs and permanent System User access tokens from their Meta Developer portals), this flow automates the credential acquisition:
* Authenticates the clinic/business owner with their Facebook account.
* Retrieves their Meta Business Portfolios and WhatsApp Business Accounts (WABAs).
* Automatically selects the onboarded phone number details.
* Registers the phone number via Meta's Graph API to support **Coexistence Mode** (allowing the number to run on both the mobile app and the Cloud API simultaneously).
* Automatically saves the authentication credentials directly to the gateway database.

---

## 2. Current Environment Configuration

The current Embedded Signup parameters are configured in the backend environment file [backend/.env](file:///c:/Users/Shree/Desktop/whatappgateway/backend/.env):

```ini
# Meta Embedded Signup Configuration
META_APP_ID=1077951981252378
META_APP_SECRET=5486b4d068c567d7aa8f91cb55f61048
META_REDIRECT_URI=https://unpopular-rage-entrust.ngrok-free.dev/api/whatsapp/callback
META_CONFIG_ID=1509977780815466
```

### Configuration Details:
* **`META_APP_ID`**: The Meta App ID connected to this gateway implementation (`1077951981252378`).
* **`META_APP_SECRET`**: The secret key for signing API requests and exchanging authorization codes (`5486b4d068c5...`).
* **`META_REDIRECT_URI`**: The callback URL Meta invokes once signup finishes. This uses the active **ngrok** tunnel endpoint (`https://unpopular-rage-entrust.ngrok-free.dev/api/whatsapp/callback`) to route requests from Meta's servers directly to your local development backend.
* **`META_CONFIG_ID`**: The **Configuration ID** representing a pre-configured Meta Embedded Onboarding Flow layout. This is utilized to trigger specific UI templates in Facebook.

---

## 3. System Architecture & Components

The integration spans the frontend Next.js app, the backend Node.js/Express server, and MongoDB.

### Database Schema (MongoDB)
* **File**: [WhatsAppConnection.js](file:///c:/Users/Shree/Desktop/whatappgateway/backend/models/WhatsAppConnection.js)
* Store authentication tokens and metadata retrieved from the signup callback:
```javascript
const WhatsAppConnectionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'disconnected',
      required: true
    },
    accessToken: { type: String, trim: true },
    businessManagerId: { type: String, trim: true },
    businessAccountId: { type: String, trim: true },
    phoneNumberId: { type: String, trim: true },
    displayPhoneNumber: { type: String, trim: true },
    businessName: { type: String, trim: true },
    portfolioName: { type: String, trim: true },
    wabaName: { type: String, trim: true },
    connectedAt: { type: Date }
  },
  { timestamps: true }
);
```

### Backend Routing & Controllers
* **Routes**: [whatsapp.routes.js](file:///c:/Users/Shree/Desktop/whatappgateway/backend/routes/whatsapp.routes.js)
  * `GET /api/whatsapp/status` (Protected): Fetches connection status.
  * `GET /api/whatsapp/connect` (Protected): Builds and returns the Meta OAuth URL.
  * `POST /api/whatsapp/disconnect` (Protected): Deletes the connection record.
  * `GET /api/whatsapp/callback` (Public): Receives the OAuth redirection parameters from Meta.
* **Controller**: [whatsapp.controller.js](file:///c:/Users/Shree/Desktop/whatappgateway/backend/controllers/whatsapp.controller.js)
  * Handles token issuance, state validation (anti-CSRF checks), callback exchanges, granular scope extraction, and DB synchronization.

### Meta Graph API Service Layer
* **File**: [whatsapp.service.js](file:///c:/Users/Shree/Desktop/whatappgateway/backend/services/whatsapp.service.js)
* Low-level methods integrating with Graph API:
  * `exchangeCodeForToken(code)`: Exits sandbox/oauth code for short-term user tokens (`/oauth/access_token`).
  * `debugToken(accessToken)`: Reads scope, expiration, and user account metadata (`/debug_token`).
  * `getWabaDetails(wabaId, token)`: Queries WhatsApp Business Account metadata (`/{waba_id}`).
  * `getWabaPhoneNumbers(wabaId, token)`: Lists registered phone numbers, IDs, and status (`/{waba_id}/phone_numbers`).
  * `getBusinessPortfolio(businessId, token)`: Gets Business Portfolio details.
  * `registerPhoneNumber(phoneId, token, pin)`: Completes coexistence setup by sending a POST request to register the number on the Cloud API (`/{phone_id}/register`).

### Frontend User Interface
* **Component**: [page.js](file:///c:/Users/Shree/Desktop/whatappgateway/frontend/app/whatsapp-connection/page.js)
* Provides a card dashboard layout:
  * Displaying active connection status, linked number, portfolio names, and account IDs.
  * Facilitates initiating the connection through the "Connect WhatsApp" button (redirecting to Meta).
  * Evaluates URL callback query parameters (`?success=true` or `?success=false&error=...`) following OAuth flow redirection to show descriptive status messages.

---

## 4. Step-by-Step Flow Execution

```mermaid
sequenceDiagram
    autonumber
    actor User as Clinic Administrator
    participant FE as Frontend Dashboard
    participant BE as Express Backend
    participant Meta as Meta Graph API
    database DB as MongoDB

    User->>FE: Click "Connect WhatsApp"
    FE->>BE: GET /api/whatsapp/connect
    BE-->>FE: Return signed OAuth redirect URL (with state & config_id)
    FE->>User: Redirect browser to Facebook Login / Embedded Signup Dialog

    User->>Meta: Authenticates & grants WhatsApp permissions
    Meta-->>User: Redirects back to BE: /api/whatsapp/callback?code=CODE&state=STATE

    activate BE
    BE->>BE: Verify anti-CSRF jwt state token
    BE->>Meta: exchangeCodeForToken(CODE)
    Meta-->>BE: Returns User Access Token
    BE->>Meta: debugToken(Access Token)
    Meta-->>BE: Returns scopes, target_ids (WABA IDs)
    BE->>Meta: getWabaPhoneNumbers(WABA ID, Access Token)
    Meta-->>BE: Returns active phone list & Phone Number IDs
    BE->>Meta: registerPhoneNumber(Phone Number ID, Access Token, pin)
    Meta-->>BE: Completes Cloud API onboarding (Coexistence)
    BE->>DB: Save credentials & connection details
    deactivate BE

    BE-->>User: Redirect browser to FE: /whatsapp-connection?success=true
    FE->>User: Display Success Toast & Connection Card Details
```

### Step 1: Onboarding Initiation
When the user clicks "Connect WhatsApp" on the UI, the frontend issues a request to `GET /api/whatsapp/connect`. The backend generates a secure state token valid for 15 minutes to mitigate Cross-Site Request Forgery (CSRF). It builds the Facebook Login redirect URL pointing to `https://www.facebook.com/v19.0/dialog/oauth` and appends:
* `client_id`: `META_APP_ID`
* `redirect_uri`: `META_REDIRECT_URI`
* `config_id`: `META_CONFIG_ID` (since it is set in `.env`)
* `state`: The JWT-signed secure state token.
* `extras`: A serialized JSON specifying onboarding setups:
  ```json
  {"setup": {}, "featureType": "whatsapp_business_app_onboarding", "sessionInfoVersion": "3"}
  ```

### Step 2: Facebook Login & Flow Delegation
The browser redirects to Meta. The administrator logs into their Facebook profile, reviews permissions (`whatsapp_business_messaging`, `whatsapp_business_management`), chooses their Meta Business Portfolio, and selects the WhatsApp Business profile/number they wish to connect.

### Step 3: Redirect Callback & Code Exchange
Upon completion, Meta redirects the user's browser back to `META_REDIRECT_URI` with the authorization code:
`GET /api/whatsapp/callback?code=AQD...&state=JWT_TOKEN`
The backend interceptor:
1. Verifies the JWT `state` payload to prevent CSRF attacks.
2. Extracts the `code` and exchanges it for a user access token by calling `https://graph.facebook.com/v19.0/oauth/access_token`.

### Step 4: Token Debugging & WABA Retrieval
The backend calls `/debug_token` using the app access token credentials. The return value lists the granular scopes approved by the user. Under the `whatsapp_business_management` scope, the backend parses `target_ids` to retrieve the registered WhatsApp Business Account (WABA) IDs.

### Step 5: Cloud API Onboarding & Coexistence Registration
To ensure the number is registered to trigger automated messages under Meta's Cloud API:
1. The backend queries WABA phone numbers to retrieve the correct `phone_number_id` and the display phone number.
2. The backend completes the coexistence flow by calling the `/register` endpoint on the phone number ID. This hooks the number directly into the API Gateway:
   ```http
   POST https://graph.facebook.com/v19.0/{phone_number_id}/register
   Payload: { "messaging_product": "whatsapp", "pin": "123456" }
   ```

### Step 6: Connection State Persistence
Once registration succeeds, the backend updates the `WhatsAppConnection` collection in MongoDB, storing:
* `status`: `'connected'`
* `accessToken`: User access token (used by the gateway to sign subsequent send-message requests)
* `businessAccountId`: Selected WABA ID
* `phoneNumberId`: Selected phone number ID
* `displayPhoneNumber`: The verified mobile phone number
* `businessName` / `portfolioName` / `wabaName`
* `connectedAt`: Timestamp

Finally, the backend redirects the browser back to the frontend dashboard:
`http://localhost:3000/whatsapp-connection?success=true`

---

## 6. Ngrok Tunnel & Webhooks Integration

To support local debugging, an active **ngrok** tunnel is used. This allows Meta's servers to talk to your local machine:

1. **Active Tunnel Command**: `npx ngrok http 5000` is currently running, exposing `http://localhost:5000` via:
   `https://unpopular-rage-entrust.ngrok-free.dev`
2. **Callback Handling**: When Meta redirects, it goes to `https://unpopular-rage-entrust.ngrok-free.dev/api/whatsapp/callback`, which ngrok forwards directly to your local backend.
3. **Webhooks Setup**: For real-time delivery status updates and customer replies, you configure the same ngrok URL inside the Meta Developer Portal -> WhatsApp -> Configuration:
   * **Webhook URL**: `https://unpopular-rage-entrust.ngrok-free.dev/api/webhook`
   * **Subscription Fields**: `messages`
