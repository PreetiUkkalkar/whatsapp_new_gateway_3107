# Meta WhatsApp Cloud API & Gateway Integration Guide

This guide provides a comprehensive, step-by-step walkthrough for setting up a **Meta Developer Account**, configuring the **WhatsApp Cloud API**, obtaining temporary and permanent access credentials, and setting up the **WhatsApp Gateway Application** from scratch.

---

## 📋 Table of Contents
1. [Meta Developer Account Registration](#1-meta-developer-account-registration)
2. [Creating a Meta App](#2-creating-a-meta-app)
3. [Adding the WhatsApp Product](#3-adding-the-whatsapp-product)
4. [Acquiring Test Credentials & Sending First Test Message](#4-acquiring-test-credentials--sending-first-test-message)
5. [Setting Up a Permanent Access Token (System User Token)](#5-setting-up-a-permanent-access-token-system-user-token)
6. [Adding a Live/Production Phone Number](#6-adding-a-liveproduction-phone-number)
7. [Configuring the WhatsApp Gateway Project](#7-configuring-the-whatsapp-gateway-project)
8. [Registering a Clinic & Sending Messages via the Gateway API](#8-registering-a-clinic--sending-messages-via-the-gateway-api)
9. [Webhooks Setup (Optional for Status Tracking)](#9-webhooks-setup-optional-for-status-tracking)

---

## 1. Meta Developer Account Registration

To use the WhatsApp Cloud API, you first need to register as a Meta Developer:

1. Visit [developers.facebook.com](https://developers.facebook.com/).
2. Click **Get Started** (or **Log In**) in the upper-right corner. Log in with your standard Facebook credentials.
3. Complete the registration flow:
   - Accept the Meta Developer Terms and Conditions.
   - Verify your phone number via SMS OTP code.
   - Choose your developer role (select **Developer** or **Product Manager**).
4. Click **Complete Registration**.

> [!IMPORTANT]
> **Two-Factor Authentication (2FA)** is strictly required by Meta for all developer profiles accessing Business tools like WhatsApp. Make sure your Facebook profile has 2FA enabled in your Security settings.

---

## 2. Creating a Meta App

Next, you need to create an application wrapper in Meta to access the APIs:

1. Navigate to the [Meta App Dashboard](https://developers.facebook.com/apps).
2. Click the green **Create App** button.
3. Select **Other** for the use case and click **Next**.
4. Choose **Business** as the app type.
   > [!NOTE]
   > The **Business** app type is highly recommended because it allows you to connect the application directly to a Meta Business Portfolio (formerly Business Manager), which is required for WhatsApp.
5. Provide the App Details:
   - **App Display Name**: E.g., `Clinic WhatsApp Gateway`
   - **App Contact Email**: Your active email.
   - **Business Account**: Select your existing Meta Business Portfolio if you have one. If you do not have one, leave it as *No Business Manager portfolio selected* (Meta will automatically create a temporary one for you).
6. Click **Create App** and input your Facebook account password for confirmation.

---

## 3. Adding the WhatsApp Product

Once your application is created, you will be redirected to the App Dashboard:

1. Scroll down to the **Add products to your app** section.
2. Locate **WhatsApp** and click the **Set up** button.
3. Choose or create a Meta Business Portfolio to link with the App, then click **Continue**.
4. Accept the WhatsApp Business Terms of Service.

---

## 4. Acquiring Test Credentials & Sending First Test Message

Once WhatsApp setup is complete, you will be taken to the WhatsApp **API Setup** page:

### Step 4.1: Copy Sandbox Credentials
Look at the **Send and receive messages** dashboard. Under **Step 1: Select phone numbers**, copy the following credentials:
1. **Temporary Access Token**: Valid for **24 hours**. (We will generate a permanent one in the next section).
2. **Phone Number ID**: A numeric ID (e.g., `105347239243789`). This represents your sandbox phone number.
3. **WhatsApp Business Account ID**: A numeric ID (e.g., `101037894234589`).

### Step 4.2: Add a Recipient Test Number
Because your app is in Sandbox mode, you can only send messages to pre-registered test numbers:
1. In the **To** field dropdown under step 1, select **Manage phone number list**.
2. Select your country code and enter your personal WhatsApp phone number (e.g. `919876543210`).
3. Complete verification by typing the OTP code sent to your WhatsApp.

### Step 4.3: Trigger a Sandbox Message
1. Click the **Send message** button on the dashboard.
2. Check your phone. You should receive a template message reading `"Welcome to the Meta WhatsApp Cloud API..."`.

---

## 5. Setting Up a Permanent Access Token (System User Token)

The temporary access token generated in the App Dashboard expires in 24 hours. For an unattended WhatsApp Gateway, you must generate a permanent token.

1. Go to the [Meta Business Settings](https://business.facebook.com/settings).
2. Ensure you have selected the correct Business Portfolio from the top-left menu.
3. In the left-hand navigation pane, expand the **Users** category and click on **System Users**.
4. Click **Add**:
   - Give the System User a name (e.g., `whatsapp_gateway_user`).
   - Select **Admin** as the system user role.
   - Click **Create System User**.
5. **Assign the App to the System User**:
   - Select the newly created system user.
   - Click **Assign Assets**.
   - Select **Apps** on the left panel, and choose your WhatsApp App.
   - Toggle **Full control (Manage App)** to active status.
   - Click **Save Changes**.
6. **Generate the Token**:
   - Select the system user again and click **Generate New Token**.
   - Select your App from the dropdown list.
   - Under scopes, check the box for the following two permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Click **Generate Token**.

> [!WARNING]
> Meta will display this token **only once**. Copy the permanent access token immediately and save it in a safe place. This is the token you will enter in the Clinic configurations.

---

## 6. Adding a Live/Production Phone Number

When you are ready to transition from a test environment to a live customer-facing number:

1. Navigate back to the Meta Developer Dashboard -> **WhatsApp** -> **API Setup**.
2. Scroll to the bottom of the page and click **Add Phone Number**.
3. Complete the business profile:
   - Business Display Name (Visible to WhatsApp users)
   - Category and Business Description
   - Website or Profile link
4. Enter the **Phone Number** you want to use.
5. **Choose Verification Method**: Select **SMS** or **Voice call** and click Next.
6. Enter the verification code sent to the number.

> [!CAUTION]
> The phone number you use **must not** be currently linked to an active WhatsApp or WhatsApp Business application installed on a mobile device. If it is, you must navigate to the settings of that app and **Delete the Account** (Settings -> Account -> Delete my account) before verifying it here. Once verified on Meta, you cannot use this number on the standard WhatsApp mobile app anymore.

---

## 7. Configuring the WhatsApp Gateway Project

This repository contains the full WhatsApp Gateway code split into a Node.js `backend` and a Next.js `frontend`.

### Step 7.1: Configure Backend Environment Variables
1. Navigate to the `backend` directory.
2. Copy the `.env.example` file to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and configure your values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/whatsapp-gateway
   JWT_SECRET=super_secret_jwt_key_for_whatsapp_gateway_dashboard
   GATEWAY_API_KEY=your_hms_gateway_secret_api_key_2026
   NODE_ENV=development
   ```

### Step 7.2: Install and Start the Backend
1. Open a terminal in the `backend` directory:
   ```bash
   npm install
   ```
2. Run the seeding script to create the default dashboard login account:
   ```bash
   node scripts/seedAdmin.js
   ```
   *This seeds an administrator account with:*
   - **Username**: `admin`
   - **Password**: `adminPassword123`
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:5000`.*

### Step 7.3: Install and Start the Frontend Dashboard
1. Open a terminal in the `frontend` directory:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *The dashboard will boot up at `http://localhost:3000`.*

---

## 8. Registering a Clinic & Sending Messages via the Gateway API

### Step 8.1: Add the Clinic Configuration in Dashboard
1. Open your browser and go to [http://localhost:3000](http://localhost:3000).
2. Log in using the seeded credentials:
   - **Username**: `admin`
   - **Password**: `adminPassword123`
3. Click on the **Clinics** tab and select **Add Clinic**.
4. Fill in the credentials obtained from the Meta Developer Dashboard:
   - **Name**: E.g., `Star Dental Clinic`
   - **Code**: E.g., `star-dental` (This is the unique ID you will use in API requests)
   - **Sender Mobile**: The verified phone number from Meta (e.g., `919876543210`)
   - **Phone Number ID**: Paste the Phone Number ID from Step 4 or 6.
   - **WhatsApp Business Account ID**: Paste the Business Account ID from Step 4.
   - **Access Token**: Paste your **Permanent Access Token** generated in Step 5.
5. Click **Save**.
6. Find the newly created Clinic in the dashboard list and click on it to retrieve its auto-generated **API Key** (e.g. `hms_key_a8d7a12bc9f34...`).

---

### Step 8.2: Send Messages via the Public REST API
Your Clinic Software/HMS can now trigger WhatsApp messages by making standard REST API requests.

**Endpoint**:
`POST http://localhost:5000/api/send-message`

**Headers**:
- `Content-Type`: `application/json`
- `x-api-key`: `hms_key_a8d7a12bc9f34...` *(Replace with your Clinic's unique API Key)*

**Request Body**:
```json
{
  "clinicId": "star-dental",
  "mobile": "919876543210",
  "message": "Hello! Your appointment at Star Dental is confirmed for tomorrow at 11:00 AM."
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:5000/api/send-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: hms_key_a8d7a12bc9f34..." \
  -d '{
    "clinicId": "star-dental",
    "mobile": "919876543210",
    "message": "Hello! Your appointment at Star Dental is confirmed for tomorrow at 11:00 AM."
  }'
```

---

## 9. Webhooks Setup (Optional for Status Tracking)

To receive real-time updates when a customer reads a message or sends a reply, you can subscribe to Meta's Webhooks:

1. In the Meta Developer Dashboard, expand **WhatsApp** and click **Configuration**.
2. Under the **Webhook** section, click **Edit**.
3. Set the fields:
   - **Callback URL**: The public endpoint of your backend (e.g., `https://your-domain.com/api/webhook`).
     - *For local development testing, you can use **ngrok** to create a secure tunnel: `ngrok http 5000`*
   - **Verify Token**: A secret string of your choosing (e.g., `my_private_webhook_token_123`) which you configure in your backend configuration.
4. Click **Verify and Save**.
5. Under the **Webhook fields** dashboard section, click **Manage** and subscribe to:
   - `messages` (triggers when a text message is received or updated to *delivered/read* status).
