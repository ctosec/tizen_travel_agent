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
  │  │              Database (PostgreSQL 16 or SQLite)             │  │
  │  │  Tables: bookings, payment_sessions                       │  │
  │  │  Default: SQLite (zero-config) | Optional: PostgreSQL     │  │
  │  └───────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘

  Payment Flow (QR-to-Phone):
    TV shows QR code -> Phone scans QR -> Phone opens Toss payment page
    -> Payment completes -> Backend pushes status via WebSocket -> TV updates

  Directory Structure:
    tizen_travel_agent/
    ├── backend/             NestJS API server
    ├── frontend/            React SPA (Tizen Web App)
    ├── nui/                 Tizen .NET NUI App (C#)
    ├── frontend-only/       Frontend-only version (no backend)
    ├── cloudflare-worker/   Gemini API proxy (Cloudflare Worker)
    └── docker-compose.yml   PostgreSQL container


2. BACKEND - BUILD & INSTALL & RUN
================================================================================

  Prerequisites:
    - Node.js 20+ (LTS recommended)
    - Git
    - Docker & Docker Compose (only if using PostgreSQL; SQLite is default)

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
      GEMINI_BASE_URL=                              # optional: Cloudflare Worker proxy URL
      GOOGLE_PLACES_API_KEY=<your_google_places_api_key>

      TOSS_CLIENT_KEY=<your_toss_client_key>
      TOSS_SECRET_KEY=<your_toss_secret_key>

      SKIP_TOSS_PAYMENT=true    # set false for real Toss payments

    Note: Get Amadeus API keys from https://developers.amadeus.com
          Get Toss keys from https://developers.tosspayments.com
          Get Gemini API key from https://aistudio.google.com/apikey
          Get Google Places key from https://console.cloud.google.com

    Gemini API region restriction:
      If the server's IP is in a region not supported by Google's Gemini API
      (error: "User location is not supported"), set GEMINI_BASE_URL to a
      Cloudflare Worker proxy. Deploy the worker from cloudflare-worker/:

        cd cloudflare-worker
        npx wrangler login
        npx wrangler deploy

      Then set: GEMINI_BASE_URL=https://gemini-proxy.<your>.workers.dev

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


4. DYNAMIC DESTINATION - LAUNCHING WITH CITY/COUNTRY
================================================================================

  The app supports dynamic destination selection. By default it loads
  Barcelona, Spain. Other apps can launch TravelAgent with a specific
  city/country via Tizen app_control data.

  4.1  How it works
  ─────────────────
    On startup (main.tsx), parseLaunchParams() resolves city/country
    from two sources in order:

    1. Tizen app_control data (key: "city", "country")
       - tizen.application.getCurrentApplication()
         .getRequestedAppControl().appControl.data
    2. URL query parameters (?city=Rome&country=Italy)
       - new URLSearchParams(window.location.search)

    If neither is provided, the default (Barcelona, Spain) is used.

    The resolved values are stored in a Zustand global store
    (travelConfigStore) which also auto-maps the city name to an
    IATA airport code via getAirportCode() (60+ cities supported).

    All pages read from this store:
      - DestinationPage: fetchDestination(country, city)
      - ItineraryPage:   generateItinerary(country, city)
      - BookingPage:     searchFlights('ICN', airportCode, ...)
                         searchHotels(airportCode, ...)

  4.2  Launching from another Tizen app (app_control)
  ────────────────────────────────────────────────────
    From another Tizen web/native app:

      var appControl = new tizen.ApplicationControl(
        "http://tizen.org/appcontrol/operation/default",
        null,
        null,
        null,
        [
          new tizen.ApplicationControlData("city", ["Rome"]),
          new tizen.ApplicationControlData("country", ["Italy"])
        ]
      );
      tizen.application.launchAppControl(
        appControl,
        "KJ3fEe8sss.TravelAgent",
        function() { console.log("launched"); },
        function(e) { console.error(e); }
      );

  4.3  Launching from shell (sdb / serial console)
  ─────────────────────────────────────────────────
    app_launcher -s KJ3fEe8sss.TravelAgent -d city Rome -d country Italy

  4.4  Launching via URL query params (browser / dev mode)
  ─────────────────────────────────────────────────────────
    http://localhost:5173/?city=Rome&country=Italy

  4.5  Supported cities (IATA airport code mapping)
  ──────────────────────────────────────────────────
    The app maps city names to IATA airport codes for flight/hotel search.
    60+ cities are pre-mapped (see frontend/src/utils/airportCodes.ts):

      Barcelona (BCN), Rome (FCO), Paris (CDG), London (LHR),
      Tokyo (NRT), New York (JFK), Seoul (ICN), Bangkok (BKK),
      Sydney (SYD), Dubai (DXB), Istanbul (IST), ...

    Unknown cities use the first 3 characters as a fallback code.

  4.6  What changes per destination
  ──────────────────────────────────
    - Destination page: city name, description, attractions
    - Itinerary page: AI-generated schedule for the target city
    - Booking page: flights from ICN to the city's airport code,
      hotels near the destination


5. QR PAYMENT - CROSS-NETWORK SETUP
================================================================================

  The payment flow works like this:
    TV shows QR code -> Phone scans QR -> Phone opens checkout page
    -> Toss payment SDK -> Payment completes -> WebSocket push to TV

  The QR code contains a URL to the backend's checkout page.
  The phone must be able to reach this URL.

  5.1  Problem: localhost / LAN IP not reachable
  ────────────────────────────────────────────────
    By default, the backend auto-detects its LAN IP (e.g. 192.168.x.x).
    This only works if the phone is on the SAME local network.

    If the phone is on mobile data or a different network, it cannot
    reach the LAN IP, and the QR payment will fail.

  5.2  Solution: Set PUBLIC_BASE_URL
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

  5.3  How it works internally
  ────────────────────────────
    1. TV app calls GET /api/server-info
    2. Backend returns { baseUrl: PUBLIC_BASE_URL || "http://<LAN_IP>:3000" }
    3. TV builds checkout URL: <baseUrl>/api/payments/checkout?orderId=...
    4. QR code encodes this checkout URL
    5. Phone scans QR -> opens checkout URL -> Toss payment SDK loads
    6. After payment, Toss redirects to <baseUrl>/api/payments/toss-result
    7. Backend confirms payment and pushes status via WebSocket to TV

  5.4  Verify QR URL
  ──────────────────
    curl http://localhost:3000/api/server-info

    Expected with PUBLIC_BASE_URL set:
      { "baseUrl": "https://xxxx.ngrok-free.app", "isPublic": true }

    Without PUBLIC_BASE_URL (LAN only):
      { "baseUrl": "http://192.168.x.x:3000", "isPublic": false }


6. LOCAL DEVELOPMENT - QUICK START
================================================================================

  Run everything on a local machine (no Docker, no cloud, no Cloudflare).
  The Gemini API works directly from Korean/US IPs without a proxy.

  6.1  Prerequisites
  ──────────────────
    - Node.js 20+
    - PostgreSQL 16 running locally, or SQLite (zero-config, see 6.2)
    - Tizen Studio with TV Extensions (for emulator testing)

  6.2  Start backend
  ──────────────────
    cd backend
    npm install

    # Create .env (copy from example or create manually)
    cat > .env << 'EOF'
    AMADEUS_CLIENT_ID=<your_key>
    AMADEUS_CLIENT_SECRET=<your_secret>
    AMADEUS_HOSTNAME=test
    GEMINI_API_KEY=<your_gemini_key>
    GOOGLE_PLACES_API_KEY=<your_places_key>
    TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
    TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
    SKIP_TOSS_PAYMENT=true
    EOF

    # Database: SQLite by default (zero-config, no Docker needed).
    # For PostgreSQL, add these to .env:
    #   DATABASE_TYPE=postgres
    #   DATABASE_HOST=localhost
    #   DATABASE_PORT=5432
    #   DATABASE_USER=postgres
    #   DATABASE_PASSWORD=travelagent123
    #   DATABASE_NAME=travel_agent_v2

    # No GEMINI_BASE_URL needed for local dev (direct API access)

    npm run start:dev
    # Backend running at http://localhost:3000

  6.3  Start frontend (browser dev mode)
  ───────────────────────────────────────
    cd frontend
    npm install

    # .env should point to local backend
    echo "VITE_API_URL=http://localhost:3000" > .env

    npm run dev
    # Opens at http://localhost:5173

    # Test with dynamic city:
    #   http://localhost:5173/?city=Rome&country=Italy
    #   http://localhost:5173/?city=Paris&country=France
    #   http://localhost:5173/?city=Tokyo&country=Japan

  6.4  Test on Tizen Emulator (from local backend)
  ─────────────────────────────────────────────────
    # 1. Set API URL for emulator (QEMU NAT gateway to host)
    echo "VITE_API_URL=http://10.0.2.2:3000" > frontend/.env.tizen

    # 2. Build, package, install, run
    cd frontend
    npm run build:tizen
    bash tizen-cli.sh package -t wgt -s <your_cert_profile> -- dist
    bash tizen-cli.sh install -n dist/TravelAgent.wgt -s emulator-26101
    bash tizen-cli.sh run -p KJ3fEe8sss.TravelAgent -s emulator-26101

    # 3. Launch with a specific city from TV shell:
    #    app_launcher -s KJ3fEe8sss.TravelAgent -d city Rome -d country Italy

  6.5  Local vs Production differences
  ─────────────────────────────────────
    ┌──────────────────────┬───────────────────────┬─────────────────────────┐
    │                      │ Local                 │ Production              │
    ├──────────────────────┼───────────────────────┼─────────────────────────┤
    │ Backend URL          │ http://localhost:3000  │ https://your-domain.com │
    │ GEMINI_BASE_URL      │ (not needed)           │ CF Worker proxy URL     │
    │ VITE_API_URL         │ http://localhost:3000  │ https://your-domain.com │
    │ .env.tizen API URL   │ http://10.0.2.2:3000  │ https://your-domain.com │
    │ Database             │ SQLite (zero-config)   │ PostgreSQL / managed DB │
    │ SKIP_TOSS_PAYMENT    │ true                   │ false                   │
    │ Certificate profile  │ tv-samsung / develop   │ tv-samsung              │
    └──────────────────────┴───────────────────────┴─────────────────────────┘

  6.6  Verify everything works
  ────────────────────────────
    # Test destination API
    curl http://localhost:3000/api/destination/Italy/Rome

    # Test itinerary generation (Gemini AI)
    curl -X POST http://localhost:3000/api/itinerary/generate \
      -H "Content-Type: application/json" \
      -d '{"country":"Italy","city":"Rome","startDate":"2026-03-15","duration":"3"}'

    # Test flight search
    curl -X POST http://localhost:3000/api/flights/search \
      -H "Content-Type: application/json" \
      -d '{"originCode":"ICN","destinationCode":"FCO","dateOfDeparture":"2026-03-15","adults":1}'

    If itinerary returns activities like "콜로세움 관람" instead of
    "도시 중심부 관광", Gemini AI is working correctly.
    If it returns generic fallback activities, check GEMINI_API_KEY.


7. NUI APP (.NET C#) - BUILD & INSTALL & RUN
================================================================================

  The NUI version is a native Tizen .NET app (C#) that provides the same
  travel agent experience using Samsung NUI (Natural UI) framework instead
  of a web-based approach. It connects to the same NestJS backend.

  7.1  Architecture
  ─────────────────
    ┌─────────────────────────────────────────────────────┐
    │           Samsung TV (Tizen 6.0+, .NET)             │
    │                                                      │
    │  ┌─────────────────────────────────────────────┐    │
    │  │        NUI App (TravelAgent.dll)             │    │
    │  │                                              │    │
    │  │  Tizen.NET 10.0 + NUI (Natural UI)           │    │
    │  │  C# 9 / .NET                                 │    │
    │  │  HTTP: System.Net.Http.HttpClient             │    │
    │  │  AI:   Google Gemini API (via HttpClient)     │    │
    │  │  JSON: System.Text.Json                       │    │
    │  │                                              │    │
    │  │  Pages:                                       │    │
    │  │    DestinationPage → AttractionCard[5]        │    │
    │  │    ItineraryPage   → ActivityCard[N]          │    │
    │  │    TravelerPage    → FocusableInput fields    │    │
    │  │    BookingPage     → FlightCard + HotelCard   │    │
    │  │                      + QR Payment             │    │
    │  └──────────────┬──────────────────────────┘    │
    │                 │ REST API (HTTP)                 │
    └─────────────────┼────────────────────────────────┘
                      │
    ┌─────────────────▼────────────────────────────────┐
    │              backend (NestJS 11)                   │
    │  Same backend as web version (Section 2)           │
    │  SQLite (default) or PostgreSQL                    │
    └───────────────────────────────────────────────────┘

  Project Structure:
    nui/TravelAgent/
    ├── App.cs                  Main app & page navigation
    ├── Program.cs              Entry point
    ├── TravelAgent.csproj      .NET project file
    ├── tizen-manifest.xml      Tizen app manifest
    ├── Components/
    │   ├── AttractionCard.cs   Destination attraction card
    │   ├── ActivityCard.cs     Itinerary activity card
    │   ├── FlightCard.cs       Flight search result card
    │   ├── HotelCard.cs        Hotel search result card
    │   ├── FocusableButton.cs  TV remote-friendly button
    │   ├── FocusableInput.cs   TV remote text input
    │   ├── GradientBackground.cs  Gradient fill view
    │   └── LoadingSpinner.cs   Loading indicator
    ├── Pages/
    │   ├── DestinationPage.cs  City info & top attractions
    │   ├── ItineraryPage.cs    AI-generated travel schedule
    │   ├── TravelerPage.cs     Traveler info form
    │   └── BookingPage.cs      Flight/hotel booking & payment
    ├── Services/
    │   ├── ApiConfig.cs        API keys & base URLs
    │   ├── GeminiService.cs    Google Gemini AI client
    │   ├── PlacesService.cs    Google Places API client
    │   ├── DestinationService.cs  Destination data orchestrator
    │   ├── ItineraryService.cs    AI itinerary generator
    │   ├── MockFlightService.cs   Mock flight data
    │   ├── MockHotelService.cs    Mock hotel data
    │   └── PaymentService.cs   Payment session & QR support
    ├── Models/                 Data models (Destination, Itinerary, Booking)
    ├── Utils/                  AirportCodes, AppColors, Currency
    └── shared/res/icon.png     App icon

  7.2  Prerequisites
  ──────────────────
    - Visual Studio 2022+ with Tizen .NET workload
      OR Visual Studio Code with Tizen .NET extension
    - Tizen Studio with TV Extensions (for emulator)
    - .NET SDK (installed with Tizen SDK tools)
    - Backend server running (Section 2 or Section 6)

  7.3  Build
  ──────────
    Using Visual Studio:
      1. Open nui/TravelAgent/TravelAgent.csproj
      2. Set build configuration to Debug or Release
      3. Build > Build Solution (Ctrl+Shift+B)

    Using CLI:
      cd nui/TravelAgent
      dotnet build

  7.4  Run on Emulator
  ─────────────────────
    1. Launch Tizen TV Emulator (same as Section 3.5)
    2. Deploy from Visual Studio:
       Debug > Start Debugging (F5)
       - Select target: emulator-26101

    Or via CLI:
      dotnet build
      sdb install -n bin/Debug/tizen10.0/com.travelagent.nui-1.0.0.tpk
      sdb shell app_launcher -s com.travelagent.nui

  7.5  Run on Physical TV
  ────────────────────────
    1. Build in Release mode
    2. Copy the .tpk to USB drive:
       cp bin/Release/tizen10.0/com.travelagent.nui-1.0.0.tpk /path/to/usb/
    3. Install via serial console:
       pkgcmd -i -t tpk -p /opt/storage/usb/sda1/com.travelagent.nui-1.0.0.tpk
    4. Launch:
       app_launcher -s com.travelagent.nui

  7.6  Focus Navigation
  ──────────────────────
    The NUI app uses D-pad (arrow keys + Enter) navigation with custom
    focus indicators per component type:

    - AttractionCard, ActivityCard: Scale-up animation (1.05x~1.08x)
      on focus, similar to the web app hover effect
    - FlightCard, HotelCard: Colored borderline (Blue/Emerald)
    - FocusableButton: Inner borderline highlight
    - FocusableInput: Border color change on focus
    - NUI default blue focus rectangle: Disabled via transparent
      FocusManager.FocusIndicator

  7.7  QR Payment (Emulator)
  ──────────────────────────
    The NUI app generates QR codes for mobile payment:

    1. App calls GET /api/server-info to get the backend's LAN IP
    2. Builds checkout URL: http://<LAN_IP>:3000/api/payments/checkout?...
    3. Generates QR image via api.qrserver.com
    4. Phone scans QR -> opens checkout -> completes payment
    5. App polls payment status until SUCCESS

    For emulator: ApiConfig.PaymentUrl defaults to http://10.0.2.2:3000
    (QEMU NAT gateway to host machine).

  7.8  Configuration
  ──────────────────
    API keys and URLs are configured in Services/ApiConfig.cs.
    Override via environment variables:

      GEMINI_API_KEY          Google Gemini API key
      GEMINI_BASE_URL         Gemini API base URL (optional proxy)
      GOOGLE_PLACES_API_KEY   Google Places API key
      PAYMENT_URL             Backend payment server URL

  7.9  Key Differences from Web Version
  ──────────────────────────────────────
    ┌──────────────────────┬──────────────────────┬─────────────────────┐
    │                      │ Web (React/.wgt)     │ NUI (.NET/.tpk)     │
    ├──────────────────────┼──────────────────────┼─────────────────────┤
    │ Language             │ TypeScript/React     │ C# 9 / .NET         │
    │ Package format       │ .wgt (Web Widget)    │ .tpk (Tizen Package)│
    │ UI framework         │ HTML/CSS/JS          │ NUI (Native UI)     │
    │ Navigation lib       │ norigin-spatial-nav  │ NUI FocusManager    │
    │ State management     │ Zustand              │ Class fields        │
    │ Real-time updates    │ WebSocket            │ HTTP polling        │
    │ Build tool           │ Vite                 │ dotnet build        │
    │ Min Tizen version    │ 4.0                  │ 6.0                 │
    └──────────────────────┴──────────────────────┴─────────────────────┘


8. BACKEND - SQLITE MODE (NO DOCKER)
================================================================================

  The backend supports SQLite as a zero-config alternative to PostgreSQL.
  This is the default mode — no Docker or database setup needed.

  8.1  How it works
  ─────────────────
    By default (no DATABASE_TYPE env var), the backend uses better-sqlite3.
    Data is stored in backend/travel_agent.db (auto-created on first run).

    To use PostgreSQL instead, set DATABASE_TYPE=postgres in .env along
    with the PostgreSQL connection parameters (see Section 2.4).

  8.2  Entity type mappings
  ─────────────────────────
    SQLite doesn't support some PostgreSQL types. The entities use
    compatible types that work with both databases:

    ┌──────────────────┬──────────────────┬──────────────────┐
    │ Field type       │ PostgreSQL       │ SQLite           │
    ├──────────────────┼──────────────────┼──────────────────┤
    │ JSON data        │ jsonb            │ simple-json      │
    │ Timestamps       │ timestamp        │ datetime         │
    │ Decimal numbers  │ decimal          │ real             │
    └──────────────────┴──────────────────┴──────────────────┘

================================================================================
