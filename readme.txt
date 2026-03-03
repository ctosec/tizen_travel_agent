================================================================================
  Samsung Tizen TV - AI Travel Agent Application
================================================================================

1. OVERALL ARCHITECTURE
================================================================================

  ┌─────────────────────────────────────────────────────────────────┐
  │                      Samsung TV (Tizen 4.0+)                    │
  │                                                                 │
  │  ┌───────────────────────────────────────────────────────────┐  │
  │  │              frontend (React SPA / .wgt)                  │  │
  │  │                                                           │  │
  │  │  React 19 + Vite 7 + TypeScript                           │  │
  │  │  Spatial Navigation (norigin-spatial-navigation v2.3)     │  │
  │  │  State: Zustand v5   |  Routing: react-router-dom v7     │  │
  │  │  Styling: Tailwind CSS v4                                 │  │
  │  │  WebSocket: socket.io-client (payment status push)        │  │
  │  │  Responsive: 1920×1080 design, auto-scaled to any TV res  │  │
  │  └──────────────┬──────────────────────┬─────────────────────┘  │
  │                 │ REST API (HTTP)       │ WebSocket              │
  └─────────────────┼──────────────────────┼────────────────────────┘
                    │                      │
  ┌─────────────────┼──────────────────────┼────────────────────────┐
  │                 ▼                      ▼         Backend Server  │
  │  ┌───────────────────────────────────────────────────────────┐  │
  │  │              backend (NestJS 11)                          │  │
  │  │                                                           │  │
  │  │  Modules:                                                 │  │
  │  │    - flights     : search & book (Amadeus GDS API)        │  │
  │  │    - hotels      : search & book (Amadeus GDS API)        │  │
  │  │    - bookings    : CRUD booking records                   │  │
  │  │    - payments    : Toss Payments + WebSocket gateway       │  │
  │  │    - itinerary   : AI trip planning (Google Gemini)        │  │
  │  │    - destination : city info & attractions                 │  │
  │  │    - places      : Google Places photo proxy               │  │
  │  │    - amadeus     : Amadeus SDK wrapper service             │  │
  │  │    - gemini      : Google Generative AI wrapper            │  │
  │  │                                                           │  │
  │  │  Port: 3000  |  Global prefix: /api                       │  │
  │  └──────────────┬────────────────────────────────────────────┘  │
  │                 │                                                │
  │  ┌──────────────▼────────────────────────────────────────────┐  │
  │  │              PostgreSQL 16                                 │  │
  │  │  Tables: bookings, payment_sessions                       │  │
  │  │  Port: 5432                                               │  │
  │  └───────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘

  Payment Flow (QR-to-Phone):
    TV shows QR code -> Phone scans QR -> Phone opens Toss payment page
    -> Payment completes -> Backend pushes status via WebSocket -> TV updates

  Directory Structure:
    tizen_travel_agent/
    ├── backend/             NestJS API server
    ├── frontend/            React SPA (Tizen Web App)
    └── docker-compose.yml   PostgreSQL container


2. BACKEND - BUILD & INSTALL & RUN
================================================================================

  Prerequisites:
    - Node.js 20+ (LTS recommended)
    - Docker & Docker Compose (for PostgreSQL)
    - Git

  2.1  Clone the repository
  ─────────────────────────
    git clone https://github.com/ctosec/tizen_travel_agent.git
    cd tizen_travel_agent

  2.2  Start PostgreSQL database
  ──────────────────────────────
    docker compose up -d

    This starts PostgreSQL 16 on port 5432 with:
      user=postgres, password=travelagent123, db=travel_agent_v2

  2.3  Install backend dependencies
  ─────────────────────────────────
    cd backend
    npm install

  2.4  Configure environment
  ──────────────────────────
    cp .env.example .env
    nano .env

    Edit the following values in .env:
      DATABASE_HOST=localhost
      DATABASE_PORT=5432
      DATABASE_USER=postgres
      DATABASE_PASSWORD=travelagent123
      DATABASE_NAME=travel_agent_v2

      AMADEUS_CLIENT_ID=<your_amadeus_api_key>
      AMADEUS_CLIENT_SECRET=<your_amadeus_api_secret>
      AMADEUS_HOSTNAME=test

      GEMINI_API_KEY=<your_google_gemini_api_key>
      GOOGLE_PLACES_API_KEY=<your_google_places_api_key>

      TOSS_CLIENT_KEY=<your_toss_client_key>
      TOSS_SECRET_KEY=<your_toss_secret_key>

      SKIP_TOSS_PAYMENT=true    # set false for real Toss payments

    Note: Get Amadeus API keys from https://developers.amadeus.com
          Get Toss keys from https://developers.tosspayments.com
          Get Gemini API key from https://aistudio.google.com/apikey
          Get Google Places key from https://console.cloud.google.com

  2.5  Build
  ──────────
    npm run build

  2.6  Run (development)
  ───────────────────────
    npm run start:dev

    Server starts on http://0.0.0.0:3000
    API endpoints available at http://localhost:3000/api/

  2.7  Run (production)
  ──────────────────────
    npm run start:prod

  2.8  Verify
  ────────────
    curl http://localhost:3000/api/flights/search \
      -H "Content-Type: application/json" \
      -d '{"originCode":"ICN","destinationCode":"NRT","dateOfDeparture":"2026-04-01","adults":1}'

    You should receive a JSON array of flight offers.

  API Endpoints:
    GET  /api/server-info                       Server base URL for QR codes
    POST /api/flights/search                    Search flights
    POST /api/flights/book                      Book a flight
    POST /api/hotels/search                     Search hotels
    POST /api/hotels/book                       Book a hotel
    GET  /api/bookings                          List bookings (supports ?ids=)
    GET  /api/bookings/:id                      Get single booking
    DELETE /api/bookings/:id                    Cancel booking
    POST /api/payments/sessions                 Create payment session
    GET  /api/payments/sessions/:orderId/status  Check payment status
    POST /api/payments/sessions/:orderId/complete  Complete payment
    GET  /api/payments/checkout                 Toss payment UI page
    GET  /api/payments/toss-result              Toss payment result callback
    GET  /api/destination/:country/:city        Get destination info
    POST /api/itinerary/generate                AI-generated itinerary
    GET  /api/places/search                     Search places by query
    GET  /api/places/photo/*photoRef            Photo proxy endpoint
    WebSocket /payments                         Real-time payment status


3. TIZEN APP - BUILD & INSTALL & RUN
================================================================================

  Prerequisites:
    - Node.js 20+
    - Tizen Studio (https://developer.tizen.org/development/tizen-studio)
      - Install "TV Extensions" via Tizen Package Manager
    - Samsung certificate profile (for signing .wgt packages)
    - Tizen TV Emulator or physical Samsung TV in developer mode

  3.1  Install frontend dependencies
  ───────────────────────────────────
    cd frontend
    npm install

  3.2  Configure API URL for target environment
  ──────────────────────────────────────────────
    Edit .env.tizen:
      VITE_API_URL=http://<BACKEND_IP>:3000

    Common values:
      - Emulator:    http://10.0.2.2:3000   (QEMU NAT gateway to host)
      - Physical TV: http://<HOST_LAN_IP>:3000
      - Same PC:     http://localhost:3000   (dev mode only)

  3.3  Development (Chrome browser)
  ─────────────────────────────────
    npm run dev

    Opens dev server at http://localhost:5173 (or next available port).
    Test at 1920×1080 in Chrome DevTools for TV-like experience.
    The UI auto-scales to any window size.

  3.4  Build & Package (.wgt)
  ───────────────────────────
    npm run build:wgt

    This runs:
      1. tsc -b              (TypeScript compile)
      2. vite build --mode tizen  (bundle with .env.tizen)
      3. tizen package -t wgt     (sign & package as TravelAgent.wgt)

    Output: frontend/dist/TravelAgent.wgt

  3.5  Launch Tizen Emulator
  ──────────────────────────
    Open Tizen Emulator Manager from Tizen Studio:
      Tools > Emulator Manager > TV emulator > Launch

    Or via CLI:
      <TIZEN_STUDIO>/tools/emulator/bin/em-cli launch --name TV

    Wait for emulator to fully boot, then verify connection:
      <TIZEN_STUDIO>/tools/sdb devices

    Expected output:
      emulator-26101       device          TV

  3.6  Install on Emulator
  ─────────────────────────
    npm run install:emul

    Or manually:
      <TIZEN_STUDIO>/tools/ide/bin/tizen install \
        -n dist/TravelAgent.wgt -s emulator-26101

  3.7  Run on Emulator
  ─────────────────────
    npm run run:emul

    Or manually:
      <TIZEN_STUDIO>/tools/ide/bin/tizen run \
        -p KJ3fEe8sss.TravelAgent -s emulator-26101

  3.8  Install on Physical Samsung TV (USB + Serial Console)
  ───────────────────────────────────────────────────────────
    1. Copy TravelAgent.wgt to a USB drive (FAT32 formatted).

    2. Plug USB drive into Samsung TV.

    3. Connect to TV serial console (UART or SDB shell):

       Option A - SDB over network:
         <TIZEN_STUDIO>/tools/sdb connect <TV_IP>
         <TIZEN_STUDIO>/tools/sdb shell

       Option B - UART serial (115200 baud, 8N1):
         screen /dev/ttyUSB0 115200

    4. Find the USB mount path:
         ls /opt/storage/usb/
         # Typically: /opt/storage/usb/sda1/

    5. Install the .wgt package:
         pkgcmd -i -t wgt -p /opt/storage/usb/sda1/TravelAgent.wgt

       Expected output:
         ... processing result : Installation is done
         ... pkgcmd  ret: 0

    6. Launch the app:
         app_launcher -s KJ3fEe8sss.TravelAgent

       Alternative launch command:
         wrt-launcher -s KJ3fEe8sss.TravelAgent

    7. Useful serial console commands:
         # List installed packages
         pkginfo --listpkg | grep -i travel

         # Check app status
         app_launcher -r KJ3fEe8sss.TravelAgent

         # Stop the app
         app_launcher -k KJ3fEe8sss.TravelAgent

         # Uninstall
         pkgcmd -u -n KJ3fEe8sss

         # View web app logs
         dlogutil WRT TizenWeb CHROMIUM

  3.9  NPM Script Reference
  ──────────────────────────
    npm run dev          Start Vite dev server (Chrome testing)
    npm run build        Standard production build
    npm run build:tizen  Build with .env.tizen configuration
    npm run build:wgt    Build + sign + package as .wgt
    npm run install:emul Install .wgt on emulator (emulator-26101)
    npm run run:emul     Launch app on emulator

  Important Notes:
    - The TV app uses .wgt (Widget) format, which is the standard package
      format for Tizen Web Applications.
    - .tpk (Tizen Package) is for native C/C++/.NET apps only.
    - Backend must be running and accessible from the TV/emulator network.
    - Ensure firewall allows inbound TCP on port 3000.
    - Tizen web apps require <access origin="*"> in config.xml for
      external API calls (already configured).
    - CORS is set to origin: '*' because Tizen apps send Origin: null
      from the app:// protocol.
    - Pointer mode is disabled via config.xml (pointing-device-support).
      Navigation is D-pad only (arrow keys + Enter on TV remote).
    - The UI is designed at 1920×1080 and auto-scales to fit any TV
      resolution (720p, 1080p, 4K) without distortion.
    - Git Bash users: tizen.bat hangs — use the included tizen-cli.sh
      wrapper which invokes Java directly.


4. QR PAYMENT - CROSS-NETWORK SETUP
================================================================================

  The payment flow works like this:
    TV shows QR code -> Phone scans QR -> Phone opens checkout page
    -> Toss payment SDK -> Payment completes -> WebSocket push to TV

  The QR code contains a URL to the backend's checkout page.
  The phone must be able to reach this URL.

  4.1  Problem: localhost / LAN IP not reachable
  ────────────────────────────────────────────────
    By default, the backend auto-detects its LAN IP (e.g. 192.168.x.x).
    This only works if the phone is on the SAME local network.

    If the phone is on mobile data or a different network, it cannot
    reach the LAN IP, and the QR payment will fail.

  4.2  Solution: Set PUBLIC_BASE_URL
  ───────────────────────────────────
    Set the PUBLIC_BASE_URL environment variable in backend/.env
    to a publicly accessible URL.

    Option A - ngrok (quickest for development):
    ─────────────────────────────────────────────
      # Install ngrok: https://ngrok.com/download
      ngrok http 3000

      # Copy the forwarding URL (e.g. https://xxxx.ngrok-free.app)
      # Add to backend/.env:
      PUBLIC_BASE_URL=https://xxxx.ngrok-free.app

      # Restart backend
      npm run start:dev

    Option B - cloudflared (no signup required):
    ─────────────────────────────────────────────
      # Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
      cloudflared tunnel --url http://localhost:3000

      # Copy the generated URL
      # Add to backend/.env:
      PUBLIC_BASE_URL=https://xxxx.trycloudflare.com

    Option C - Public server deployment:
    ─────────────────────────────────────
      # Deploy backend to a cloud server (AWS, GCP, etc.)
      # Add to backend/.env:
      PUBLIC_BASE_URL=https://your-domain.com

  4.3  How it works internally
  ────────────────────────────
    1. TV app calls GET /api/server-info
    2. Backend returns { baseUrl: PUBLIC_BASE_URL || "http://<LAN_IP>:3000" }
    3. TV builds checkout URL: <baseUrl>/api/payments/checkout?orderId=...
    4. QR code encodes this checkout URL
    5. Phone scans QR -> opens checkout URL -> Toss payment SDK loads
    6. After payment, Toss redirects to <baseUrl>/api/payments/toss-result
    7. Backend confirms payment and pushes status via WebSocket to TV

  4.4  Verify QR URL
  ──────────────────
    curl http://localhost:3000/api/server-info

    Expected with PUBLIC_BASE_URL set:
      { "baseUrl": "https://xxxx.ngrok-free.app", "isPublic": true }

    Without PUBLIC_BASE_URL (LAN only):
      { "baseUrl": "http://192.168.x.x:3000", "isPublic": false }

================================================================================
