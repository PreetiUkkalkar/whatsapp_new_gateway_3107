# WhatsApp Gateway Development & Test Setup Guide

This guide details the setup and configuration of the WhatsApp Gateway application using a **Meta Developer Account in Sandbox (Test) mode** with a **Temporary Access Token**.

---

## 📋 Table of Contents
1. [Meta Developer Sandbox Registration](#1-meta-developer-sandbox-registration)
2. [Creating a Meta Business App](#2-creating-a-meta-business-app)
3. [Setting up WhatsApp Sandbox Product](#3-setting-up-whatsapp-sandbox-product)
4. [Acquiring Sandbox Test Credentials](#4-acquiring-sandbox-test-credentials)
5. [Registering a Recipient Test Phone Number](#5-registering-a-recipient-test-phone-number)
6. [Configuring & Running the Local Gateway Project](#6-configuring--running-the-local-gateway-project)
7. [Adding a Clinic in the Dashboard & Copying the API Key](#7-adding-a-clinic-in-the-dashboard--copying-the-api-key)
8. [Sending Test Messages via REST API](#8-sending-test-messages-via-rest-api)

---

## 1. Meta Developer Sandbox Registration

To begin testing, register as a Meta Developer:

1. Visit [developers.facebook.com](https://developers.facebook.com/).
2. Click **Get Started** (or **Log In**) in the upper-right corner and log in with your Facebook credentials.
3. Accept the Meta Developer Terms, verify your mobile number with the SMS code, and complete registration.

---

## 2. Creating a Meta Business App

Create an application container to access the WhatsApp sandbox:

1. Go to the [Meta App Dashboard](https://developers.facebook.com/apps).
2. Click the green **Create App** button.
3. Under App Use Case/Type: Select **Other** -> Click **Next** -> Choose **Business** -> Click **Next**.
4. Set details:
   - **App Display Name**: E.g., `WhatsApp Gateway Test`
   - **App Contact Email**: Your active email.
   - **Business Account**: Leave it as *No Business Manager portfolio selected* (Meta will automatically create a temporary one for you).
5. Click **Create App** and verify with your password.

---

## 3. Setting up WhatsApp Sandbox Product

1. On the app dashboard page, scroll down to **Add products to your app**.
2. Find **WhatsApp** and click **Set up**.
3. Select your Business portfolio (or let Meta create one) and click **Continue**.

---

## 4. Acquiring Sandbox Test Credentials

After the WhatsApp product setup completes, you will be redirected to the **API Setup** page. Under the **Send and receive messages** section, copy the following values:

1. **Temporary Access Token**
   - *Note: This token is valid for **24 hours**. You will need to copy a new one from the Meta Developer dashboard if it expires.*
2. **Phone Number ID** (The test sandbox sender number ID)
3. **WhatsApp Business Account ID**

---

## 5. Registering a Recipient Test Phone Number

In the Sandbox environment, Meta restricts you to sending messages **only** to phone numbers that you have explicitly verified.

1. On the **API Setup** page, locate **Step 1: Select phone numbers**.
2. In the **To** field dropdown, select **Manage phone number list**.
3. Add your personal WhatsApp phone number (with the country code, e.g. `919876543210`).
4. Enter the verification code sent to your personal WhatsApp to register it.

---

## 6. Configuring & Running the Local Gateway Project

Ensure your local backend and frontend are running:

### Step 6.1: Backend Configuration
1. Go to the `backend` folder.
2. Create/update your `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/whatsapp-gateway
   JWT_SECRET=super_secret_jwt_key_for_whatsapp_gateway_dashboard
   GATEWAY_API_KEY=your_hms_gateway_secret_api_key_2026
   NODE_ENV=development
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed the default admin user:
   ```bash
   node scripts/seedAdmin.js
   ```
   *This sets up:*
   - **Username**: `admin`
   - **Password**: `adminPassword123`
5. Run the backend:
   ```bash
   npm run dev
   ```

### Step 6.2: Frontend Configuration
1. Go to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

---

## 7. Adding a Clinic in the Dashboard & Copying the API Key

Connect your local dashboard configuration with your Meta sandbox credentials:

1. Open [http://localhost:3000](http://localhost:3000) and log in with the seeded details (`admin` / `adminPassword123`).
2. Go to the **Clinics** tab and click **Add Clinic**.
3. Fill in the credentials:
   - **Name**: E.g., `Test Clinic`
   - **Code**: `test-clinic` (This is the unique ID used in API requests)
   - **Sender Mobile**: Your sandbox phone number (listed in Meta API Setup)
   - **Phone Number ID**: Paste the Phone Number ID from Meta.
   - **WhatsApp Business Account ID**: Paste the Business Account ID from Meta.
   - **Access Token**: Paste the **Temporary Access Token** from Meta.
4. Click **Save**.
5. Copy the newly generated **API Key** (e.g. `hms_key_...`) from the clinic entry.

---

## 8. Sending Test Messages via REST API

You can trigger a WhatsApp message to your registered recipient test phone number using a REST client (like Postman or curl):

**Endpoint**:
`POST http://localhost:5000/api/send-message`

**Headers**:
- `Content-Type`: `application/json`
- `x-api-key`: `YOUR_CLINIC_API_KEY` (The `hms_key_...` you copied in Step 7)

**Request Body**:
```json
{
  "clinicId": "test-clinic",
  "mobile": "YOUR_REGISTERED_RECIPIENT_NUMBER",
  "message": "Hello! This is a test notification from the Sandbox WhatsApp Gateway."
}
```

**Curl Command**:
```bash
curl -X POST http://localhost:5000/api/send-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: hms_key_your_clinic_api_key_here" \
  -d '{
    "clinicId": "test-clinic",
    "mobile": "919876543210",
    "message": "Hello! This is a test notification from the Sandbox WhatsApp Gateway."
  }'
```

> [!NOTE]
> **Coexistence Support**
> WhatsApp Coexistence allows a phone number to run on both the WhatsApp Business mobile application and the WhatsApp Cloud API simultaneously. The user maintains their existing chat history and can continue using the mobile app on their phone for manual chats, while the WhatsApp Gateway uses the Cloud API in parallel for automation. During Embedded Signup, the user selects coexistence rather than performing a one-way migration, allowing both access channels to remain active.

---

## 9. Registering a Phone Number Currently in Use on a Mobile Device

If the phone number you want to use for the WhatsApp Cloud API (production level) is currently registered on the **regular WhatsApp** or **WhatsApp Business** mobile application, Meta will block registration with a "number already registered" error. 

To resolve this and link it to the Cloud API:

### Step 9.1: Back Up Chat History (Critical)
Migration from the mobile application to the Meta Developer Cloud API is **one-way**. Once migrated, you **cannot** restore or import your old chat history into the Cloud API.
- Open WhatsApp on your phone.
- Navigate to **Settings** -> **Chats** -> **Chat Backup** and run a manual backup to save your data for your records.
- (Optional) Manually export important chats as text files.

### Step 9.2: Delete the WhatsApp Account from Your Phone
To release the phone number so the Cloud API can claim it:
1. Open the WhatsApp or WhatsApp Business app on your mobile device.
2. Go to **Settings** -> **Account**.
3. Select **Delete My Account** (or **Delete Account**).
4. Enter your phone number in full international format (e.g., country code + phone number) and click **Delete My Account**.
5. Once the deletion is complete, uninstall the WhatsApp app from your phone.

> [!WARNING]
> Simply uninstalling the app from your device will **not** work. You must explicitly trigger the **Delete Account** option inside the app settings to free up the number on Meta's registration servers.

### Step 9.3: Add and Verify on Meta Developer Portal
1. Go back to your **Meta Developer Dashboard** -> **WhatsApp** -> **API Setup**.
2. Scroll to the bottom and click **Add Phone Number**.
3. Fill in your business details.
4. Input the phone number you just deleted.
5. Select **SMS** or **Voice call** to receive your 6-digit verification code.
6. The SMS code will arrive as a standard text message on your physical phone (not on the WhatsApp app, which is deleted). Enter this code on the Meta dashboard to complete verification.

