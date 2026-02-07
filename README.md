# Q-Safe

Q-Safe is a Chrome extension that helps users determine whether a website is using post-quantum-capable TLS (PQC / hybrid TLS) heuristically. The extension inspects TLS connection metadata (when available) and certificates to infer signals of hybrid or PQC-enabled TLS, and provides a quick pass/fail status in the popup UI.

## Features
- Inspect TLS metadata using Chrome's webRequest.getSecurityInfo (when available).
- Heuristic detection for hybrid TLS / PQC indicators (e.g., CECPQ2, Kyber, NTRU, SABER, HYBRID).
- Popup UI with an "Analyze Current Site" button and clear status and output.


## How it works
- When you click "Analyze Current Site", the extension attempts to read TLS/security information for the active tab (via webRequest.getSecurityInfo).
- It searches fields such as key exchange, key exchange group, cipher, signature algorithm, and certificate metadata for PQC/hybrid markers.
- If the security API is not available in the runtime, the extension falls back to lightweight heuristics (less reliable).

## Installation (development / testing)
1. Clone or copy this repository to your machine:
   - Example: git clone https://github.com/RakeshMahanthi/Q-Safe.git && cd Q-Safe

2. Load the extension in Chrome:
   - Open Chrome and navigate to chrome://extensions
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked" and select this project's folder (the folder that contains manifest.json and popup.html)
   - Ensure extension is enabled

3. Grant permissions:
   - The extension requires webRequest/host permissions to inspect TLS info. Confirm any permission prompts shown by Chrome.
   - Note: webRequest.getSecurityInfo availability depends on Chrome version and platform; if not available, the extension uses fallback heuristics.

## Usage
- Click the extension icon to open the popup.
- Click "Analyze Current Site".
- Status dot and output box will show inferred PQC/hybrid TLS signals:
  - Green: indicates heuristics found hybrid/PQC indicators
  - Amber: default/unknown (no clear indicators found or API unavailable)
  - Red: explicit negative signals (rare)

## Limitations & Privacy
- Detection is heuristic-based and cannot guarantee a site's true cryptographic configuration.
- Accurate detection depends on Chrome's webRequest.getSecurityInfo API; availability varies by browser version and platform.
- The extension only reads connection metadata and certificates for the purpose of inference and does not transmit site certificate data externally.
- Do not rely on this extension as the sole authority for security decisions.

## Development notes
- Primary TLS check logic is implemented in `background.ts` (or equivalent utility file).
- UI is in `popup.html` / `popup.js`.
