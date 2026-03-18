# Compass Friend 🧭

Compass Friend is a real-time, collaborative compass application designed to bring people together. Whether you're exploring a new city or just want to feel connected to someone special, Compass Friend shows you exactly which direction your friend is in, relative to your own heading.

## ✨ Features

- **Real-time Syncing**: See your friend's heading and location update live on your compass.
- **Username System**: Connect easily using custom usernames instead of long, complex IDs.
- **Immersive UI**: A beautiful, minimal design with smooth animations and a "warm organic" aesthetic.
- **Relationship Modes**: Toggle between "Friendship" and "Love" modes to customize your experience (complete with sparkles or hearts!).
- **Calibration Tips**: Built-in guidance for mobile sensors to ensure the most accurate heading.
- **Privacy First**: Secure Firestore rules ensure only you and your connected friend can see your location data.

## 🚀 How to Use

1. **Sign In**: Log in with your Google account.
2. **Set Your Username**: Go to Settings (gear icon) and claim your unique username.
3. **Connect**: 
   - Share your username with a friend.
   - Enter their username in the "Connect to Friend" box.
4. **Find Each Other**: Once connected, the compass needle will point towards your friend. When you're both facing each other, the screen will glow with a special animation!

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion (motion/react).
- **Backend**: Firebase (Authentication & Firestore).
- **Icons**: Lucide React.
- **Sensors**: Web Device Orientation & Geolocation APIs.

## 🔒 Permissions

To function correctly, this app requires:
- **Location**: To calculate the bearing between you and your friend.
- **Motion/Orientation**: To detect which way your device is pointing.
