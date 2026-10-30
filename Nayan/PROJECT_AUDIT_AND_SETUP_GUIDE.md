# Nayan: Women's Safety AI Platform
## System Run Status, Comprehensive Architecture Audit & Setup Guide

---

## 1. Current Live Services & Access Links

All three tiers of the Nayan platform are currently active and running in local development mode:

| Subsystem | Technology | Local URL / Access | Status | Active Process |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API & ML Engine** | FastAPI, Uvicorn, Python 3.11 | [http://localhost:8000](http://localhost:8000) & [API Docs (Swagger)](http://localhost:8000/docs) | **Running** | Daemon `task-824` |
| **Police Admin Dashboard** | React 18, Webpack, Reactstrap | [http://localhost:3000](http://localhost:3000) | **Running** | Daemon `task-628` |
| **Citizen Mobile App** | React Native, Expo SDK 51 | `exp://192.168.0.101:8081` (Port 8081) | **Running** | Daemon `task-678` |

---

## 2. System Architecture & Component Breakdown

```mermaid
graph TD
    subgraph Edge & Citizen Clients
        App["Citizen Mobile App<br>(React Native / Expo)"] -->|SOS Alert / Audio Stream / GPS| FastApi
        CCTV["Street & Campus CCTVs<br>(RTSP / Video Streams)"] -->|Video Frames / WebSockets| FastApi
    end

    subgraph Nayan AI Core Backend [FastAPI Server :8000]
        FastApi["FastAPI Gateway"]
        YOLO["YOLOv8 Gender Classifier"]
        MediaPipe["MediaPipe Hand Gesture Tracking"]
        Lighting["OpenCV Low-Light Analysis"]
        DistilBERT["DistilBERT Emotion Classifier"]
        HotspotEngine["Hotspot & Crime Density Engine"]
        
        FastApi --> YOLO
        FastApi --> MediaPipe
        FastApi --> Lighting
        FastApi --> DistilBERT
        FastApi --> HotspotEngine
    end

    subgraph Dispatches & Storage
        FastApi -->|SMS & Voice Calls| Twilio["Twilio SMS & Voice / Mock Fallback"]
        FastApi -->|Audio Storage| Cloudinary["Cloudinary Cloud Storage"]
        FastApi -->|Camera & Alert Records| Storage[("Supabase Cloud / Local JSON Fallback")]
    end

    subgraph Control Room
        FastApi -->|Real-time Alert WebSockets| Dashboard["React Police Dashboard :3000"]
    end
```

### Core Subsystems Deep Dive

### A. Computer Vision & Threat Inference Engine (`backend/`)
1. **Distress Gesture Recognition (`routes/gesture_handler.py`)**:
   - Analyzes real-time video feeds using **Google MediaPipe** (tracking 21 3D hand joints).
   - Recognizes the universal 3-step distress signal:
     $$\text{Open Palm} \longrightarrow \text{Thumb Tuck} \longrightarrow \text{Closed Fist}$$
   - When sequence duration matches distress timing ($<3$ seconds), an immediate high-priority alert is generated.
2. **Gender Classification & Crowd Threat (`ml_models/gender.py`)**:
   - Custom **YOLOv8** model (trained on Roboflow dataset `gender-bkoji/1`).
   - Detects persons, isolates bounding boxes, and classifies gender (`female`, `male`).
   - Uses Euclidean distance calculations between bounding box centroids to identify anomalous crowd formations (e.g., an isolated female encircled or tracked by multiple males).
3. **Low-Light / Lone Woman Detection (`helpers/lighting.py`)**:
   - Calculates grayscale brightness histograms and luminance levels.
   - Triggers an alert when a solitary woman is detected in poorly lit or unlit areas past 10:00 PM.
4. **Violence & Aggression Detection (`ml_models/violence_detection.py`)**:
   - Video classification model built on Keras/TensorFlow analyzing motion patterns and optical flow for violent interactions.
5. **Crime Hotspot & Proximity Engine (`routes/hotspotRoutes.py`, `helpers/hotspotDetectionHelper.py`)**:
   - Analyzes geographic crime rate logs.
   - Calculates dynamic bounding polygons and geofences using DBSCAN clustering.
   - Pushes real-time warnings to mobile clients entering high-risk geofenced zones.

### B. Citizen Mobile App (`app/`)
- **Instant SOS Dispatch**: Single-tap emergency activation with haptic feedback and countdown cancellation.
- **Audio Sentiment & STT**: Asynchronously captures background ambient audio and streams to backend for distress acoustic classification.
- **Emergency Geocoding**: Direct OpenStreetMap Nominatim reverse geocoding to display street addresses, nearest hospitals, and police stations.

### C. Police Admin Surveillance Dashboard (`dash_frontend/`)
- **Live Camera Grid**: Surveillance camera management with RTSP/video stream viewer.
- **Instant Alert Popups**: Subscribed to backend WebSocket (`ws://localhost:8000/ws/base-alert`), notifying dispatchers within 3 seconds of AI detection.
- **Geotagging & Heatmaps**: Interactive Leaflet maps rendering city-wise crime clusters and camera positions.

---

## 3. External Services & API Key Audit

Every external service, API key, and database was tested directly against its live endpoints:

| Service | Config Location | Status | Diagnosis & Findings |
| :--- | :--- | :--- | :--- |
| **Supabase DB** | `backend/workers/database.py` | ⚠️ **EXPIRED / PAUSED** | Domain `vikjfvifgiiffvzayvws.supabase.co` returns `NXDOMAIN` (free tier project auto-paused or removed). |
| **Firebase Auth** | `dash_frontend/src/firebase.js` | ⚠️ **EXPIRED / INVALID** | Key `AIzaSyA4YZVp-LPaIGnQ0Y0TU-h7NyPwYIoWtKc` returns `400 API_KEY_INVALID` from Google Identity Toolkit. |
| **Twilio API** | `backend/helpers/twillio.py` | ⚠️ **MISSING CONFIG** | No `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` was present in the repository. |
| **Ngrok URLs** | `app/screens/DashScreen/SOSNotify.js` | ⚠️ **EXPIRED** | Old ngrok tunnel `https://82b4-...ngrok-free.app` is dead. |
| **Roboflow API** | `backend/ml_models/gender.py` |  **ACTIVE & VALID** | Key `0Hh1bvT2yb5UXrNloKWV` tested: model `gender-bkoji/1` responds 200 OK with classes `["female", "male"]`. |
| **Cloudinary** | `backend/routes/websocket_handler_app.py` |  **ACTIVE & VALID** | Cloud `dqabgjv3y`, preset `ml_default` tested: upload to folder `sih_audios` returned 200 OK. |

---

## 4. Improvements & Resilience Safeguards Added

To make the codebase robust and immediately usable out-of-the-box without requiring third-party accounts:

1. **Local Fallback Storage for Database**:
   - `camera_DB.py` and `alerts_DB.py` automatically catch Supabase connection errors and seamlessly read/write from local JSON files:
     - `backend/data/cameras.json`
     - `backend/data/alerts.json`
2. **Dashboard Demo / Guest Login Mode**:
   - Added an **"Enter Dashboard as Guest / Demo Admin →"** button on `dash_frontend/src/layouts/SignIn.js` to allow instant access to all dashboard features without needing Firebase Authentication.
3. **Mock Twilio Fallback**:
   - If Twilio credentials are not set, `twiliosms.py` and `twillio.py` log simulated SMS and voice calls to the console instead of raising runtime exceptions.
4. **Centralized Mobile App Config**:
   - Created `app/config.js` pointing to your computer's local network IP (`http://192.168.0.101:8000`), replacing obsolete hardcoded ngrok links.
5. **Python 3.11 & MediaPipe / Protobuf Compatibility**:
   - Pinned `mediapipe==0.10.14` under Python 3.11 with a compatibility runtime shim for protobuf, resolving conflicts between TensorFlow and MediaPipe solutions.
6. **Config Templates**:
   - Created `backend/.env.example`
   - Created `dash_frontend/.env.example`

---

## 5. Step-by-Step Setup for Live Cloud Services

If you wish to replace local fallbacks with live cloud accounts, follow these instructions:

### A. Supabase Database Setup
1. Sign up / log in at [supabase.com](https://supabase.com).
2. Click **New Project**, name it `Nayan`, and set a database password.
3. Once the database is ready, click **SQL Editor** on the left navigation and run:
   ```sql
   create table camera (
     id bigint generated by default as identity primary key,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     "Name" text,
     "modelNo" text,
     brand text,
     "ipAddress" text,
     link text,
     lat text,
     lon text,
     status text default 'A'
   );
   ```
4. Go to **Project Settings** (gear icon) $\to$ **API**.
5. Copy the **Project URL** and the **anon public API key**.
6. Create `backend/.env` and paste:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   ```

---

### B. Firebase Authentication Setup (Admin Dashboard)
1. Go to [console.firebase.google.com](https://console.firebase.google.com/) and create a project.
2. In the left sidebar, click **Build** $\to$ **Authentication** $\to$ **Get Started**.
3. Under **Sign-in method**, enable **Email/Password** and **Google**.
4. In **Project Settings** (gear icon) $\to$ **General**, scroll to **Your apps** and click the **Web (`</>`)** icon.
5. Register the app and copy the credentials into `dash_frontend/.env`:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-app
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

---

### C. Twilio SMS & Voice Calling (SOS Dispatches)
1. Register for a free account at [twilio.com](https://www.twilio.com).
2. In the Twilio Console, note your:
   - **Account SID**
   - **Auth Token**
   - **Twilio Virtual Phone Number** (click *Get Phone Number*)
3. Go to **Phone Numbers** $\to$ **Manage** $\to$ **Verified Caller IDs** and add the destination numbers you want to test alerts with (required during Twilio trial).
4. Add the credentials to `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_PHONE=+1XXXXXXXXXX
   VOICEMAIL_URL_HIGH=https://handler.twilio.com/twiml/your_twiml_url
   VOICEMAIL_URL_MED=https://handler.twilio.com/twiml/your_twiml_url
   VOICEMAIL_URL_LOW=https://handler.twilio.com/twiml/your_twiml_url
   ```

---

## 6. How to Run and Interact with the Platform

### Running the Services
If servers are ever stopped, they can be launched individually as follows:

```bash
# 1. Backend API (FastAPI)
cd /Users/joy0919/Developer/College/Nayan/Nayan/Nayan/backend
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

# 2. React Admin Dashboard
cd /Users/joy0919/Developer/College/Nayan/Nayan/Nayan/dash_frontend
npm start

# 3. Expo Mobile App
cd /Users/joy0919/Developer/College/Nayan/Nayan/Nayan/app
npx expo start --port 8081
```

### Accessing the Applications
- **Police Admin Dashboard**: Visit [http://localhost:3000](http://localhost:3000). Click **"Enter Dashboard as Guest / Demo Admin →"** to access the map views, live camera streams, alert notifications, and crime analytics.
- **FastAPI Interactive Docs**: Visit [http://localhost:8000/docs](http://localhost:8000/docs) to test any endpoint directly from the browser.
- **Citizen Mobile App**: Open the **Expo Go** app on your physical mobile phone (connected to the same Wi-Fi `192.168.0.101`) and scan the QR code in the Expo terminal.
