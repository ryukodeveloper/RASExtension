## 🚀 Ryuko Auto Share (v1.0)

**Ryuko Auto Share** is a high-performance, background-capable browser extension designed to automate link sharing on Facebook. Built with **Manifest V3**, it is fully optimized for both **Desktop** and **Mobile** browsers (like Kiwi, Mises, and Orion).

---

### ✨ Key Features

* **🔄 Background Processing:** Uses the `chrome.alarms` API to ensure sharing continues even if you close the popup or switch apps on your phone.
* **📱 Mobile Optimized:** Specifically designed to bypass mobile battery restrictions that usually kill background scripts.
* **🔔 System Notifications:** Get real-time OS-level alerts when a task finishes or if an error occurs.
* **🎨 Dynamic UI:** The interface adapts! The "Start" button transforms into a "Stop" button with real-time status syncing.
* **📜 Persistent Logs:** Terminal logs are saved to local storage. You can close and reopen the extension anytime to check progress.
* **🍪 Auto-Session Detection:** Automatically identifies your active Facebook session—no manual token pasting required.

---

### 🛠️ How It Works

The extension operates through a three-layer architecture to ensure it never stops mid-task:

#### 1. The Handshake (Popup)
When you open the extension, it queries your browser cookies for `facebook.com`. It identifies the `c_user` fragment to ensure you are logged in. Once you hit **Start**, it sends your configuration (URL, Count, Interval) to the background Service Worker.

#### 2. The Brain (Service Worker)
The `background.js` takes over:
* It performs a "silent login" to `business.facebook.com` using your cookies to extract a temporary **EAAG Access Token**.
* Instead of a standard JavaScript timer (which browsers often kill to save RAM), it registers a **System Alarm**. 
* Even if the browser is minimized, the Alarm wakes up the extension at your set interval to perform the next share.

#### 3. The Execution (Graph API)
For every "tick" of the alarm, the extension sends a `POST` request to the **Facebook Graph API** (`/me/feed`). 
* It sets the privacy to `SELF` (Only Me) by default to increase the "Share Count" on the target post without cluttering your public timeline.
* Each successful share is logged with a unique ID and saved to `chrome.storage`.

---

### 📲 How to Install

#### On Desktop (Chrome/Edge/Brave)
1.  Download the ryukoautoshare.zip file located in [releases](https://github.com/ryukodeveloper/Ryuko-Auto-Share-Extension/releases/tag/RyukoAutoShare), and unzip it with a new folder.
2.  Open `chrome://extensions`.
3.  Enable **Developer Mode** (top right toggle).
4.  Click **Load Unpacked** and select your project folder.

#### On Mobile (Android - Kiwi Browser)
1.  Open **Kiwi Browser** and go to the three-dot menu.
2.  Select **Extensions**.
3.  Enable **Developer Mode**.
4.  Click **+(from .zip/.crx/.user.js)** or use the file explorer to upload the folder.

---

### ⚠️ Disclaimer
This tool is for **educational and personal use only**. Please respect Facebook's Terms of Service. Setting intervals too low (e.g., under 1500ms) may result in temporary feature blocks from Facebook.

---

### 👤 Credits
**Created by Ryuko Developer**. Follow me for more tools:
* [Facebook](https://facebook.com/ryukodev)
* [GitHub](https://github.com/ryukodeveloper)

---
> **Pro Tip:** For the best stability on mobile devices, ensure your browser's battery settings are set to **"Unrestricted"** in your phone's App Info settings.
