# TomatoFocus - AI Focus Timer 🍅

TomatoFocus is a modern, open-source Chrome Extension designed to boost productivity using the Pomodoro Technique. It combines a clean, circular timer with a powerful website blocker and AI-driven motivation to help you stay focused on your tasks.

![TomatoFocus Screenshot](public/logo192.png) 
*(Replace this link with an actual screenshot of your app if available)*

## 🚀 Features

- **Pomodoro Timer**: Customizable Focus, Short Break, and Long Break intervals.
- **Smart Cycle Automation**: Automatically transitions between Focus and Break modes to keep your flow interruption-free.
- **Distraction Blocker**: Blocks specific websites (e.g., social media, news) **only** during Focus sessions.
- **Persistent Timer**: The timer maintains accuracy and state even if you close the extension popup or restart the browser.
- **Desktop Notifications**: Get alerted immediately when it's time to take a break or get back to work.
- **Focus Assistant**: Provides motivational quotes, strict "scolding" (if you stray), and break strategies.
- **Privacy First**: All data (blocked sites, timer state) is stored locally on your device.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js installed on your machine.
- Google Chrome (or a Chromium-based browser like Brave or Edge).

### 1. Build the Extension
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tomato-focus.git
   cd tomato-focus
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
   This command creates a `dist` directory containing the compiled extension files.

### 2. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** on in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `dist` folder generated in the previous step.
5. The **TomatoFocus** icon should appear in your browser toolbar. Pin it for easy access!

## 📖 How to Use

1. **Configure Settings**: Click the ⚙️ icon to set your preferred durations (default: 25min Focus, 5min Short Break, 15min Long Break).
2. **Add Blocked Sites**: 
   - Click the "Block List" tab.
   - Type a domain (e.g., `facebook.com`, `twitter.com`) and click **+**.
   - These sites will be inaccessible while the Focus timer is running.
3. **Start Focusing**: 
   - Click the **Play** button on the main timer screen.
   - The app will automatically cycle through: `Focus` -> `Short Break` -> `Focus` ... -> `Long Break`.
4. **Stay Motivated**: Check the bottom of the timer screen for AI-generated tips and motivation.

## 💻 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Platform**: Chrome Extension Manifest V3

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or bug fixes:
1. Fork the repo.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
