# 🎬 GIF Maker Browser

Create animated GIFs from images, text, or canvas animations - entirely in your browser! No server required, your files never leave your device.

## ✨ Features

- **📁 Image to GIF** - Upload multiple images and convert them to animated GIF
- **📝 Text to GIF** - Create animated text GIFs with bounce effects and custom colors
- **🎥 Animation Recorder** - Record canvas animations with rotating text effects
- **🖼️ Frame Management** - Add, remove, reorder, and duplicate individual frames
- **🔄 Frame Reordering** - Drag and drop frames to reorder them
- **⏱️ Individual Frame Delay** - Set unique timing for each frame
- **▶️ Preview Animation** - Preview your GIF before exporting
- **↩️ Undo/Redo** - Undo or redo frame operations (up to 20 steps)
- **🛡️ File Size Validation** - Automatically rejects oversized files (10MB limit)
- **⌨️ Keyboard Shortcuts** - Ctrl+G generate, Ctrl+O open, Ctrl+P preview, Ctrl+D download, Ctrl+Z undo, Ctrl+Y redo
- **📱 PWA Support** - Install as a standalone app with offline support
- **🌓 Dark/Light Theme** - Toggle between beautiful dark and light interfaces
- **💾 Settings Persistence** - Your preferences are automatically saved

## 🚀 How to Use

### Image to GIF
1. Drag and drop images or click to browse
2. Adjust frame delay (speed) as needed
3. Preview frames in the frame gallery
4. Use frame controls to reorder, duplicate, or remove frames
5. Adjust individual frame delays by editing the ms value
6. Click "Preview Animation" to see it play
7. Click "Generate GIF" to create your animation
8. Download your GIF file

### Text to GIF
1. Enter your text
2. Choose colors and font size
3. Click "Create Text GIF"
4. Watch your text bounce into an animation!
5. Edit individual frame delays if needed

### Animation Recorder
1. Enter animation text
2. Choose a color
3. Click "Start Recording" to capture 30 frames
4. Preview, reorder, or adjust delays as needed
5. Generate and download your animated GIF

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Generate GIF |
| `Ctrl+O` | Open files |
| `Ctrl+P` | Preview animation |
| `Ctrl+D` | Download GIF |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` | Redo last undone action |
| `T` | Toggle dark/light theme |

## 🌓 Theme Toggle

Click the ☀️/🌙 button in the top-right corner to switch between dark and light themes. Your preference is automatically saved for future visits.

## 🛠️ Tech Stack

- Pure HTML/CSS/JavaScript
- [gif.js](https://github.com/jnordberg/gif.js) for GIF generation
- Works offline as PWA with service worker caching
- No external servers - everything happens in your browser

## 📦 Installation (PWA)

1. Open the site in Chrome/Edge
2. Click the install icon in the address bar
3. Enjoy as a standalone app!
4. Works offline after first visit

## 🆕 Recent Updates

### v1.3.0
- ↩️ **Undo/Redo functionality** - Undo or redo frame operations (Ctrl+Z/Ctrl+Y)
- 🛡️ **File size validation** - Auto-reject files larger than 10MB
- ⌨️ **Fixed keyboard shortcuts** - All shortcuts now properly implemented
- 🔧 **Improved error handling** - Better feedback on file errors

### v1.2.0
- 🌓 Added dark/light theme toggle
- 💾 Settings persistence (frame delay, colors, font size)
- ✨ Smooth animations and transitions
- 🎨 Improved visual polish

### v1.1.0
- ✨ Added frame preview animation (▶️ Preview button)
- 🔄 Drag & drop frame reordering
- ⏱️ Individual frame delay controls
- 🔁 Duplicate frames feature
- 📊 Total duration display in stats bar
- 🔧 Fixed service worker for offline support
- ⌨️ Added Ctrl+P and Ctrl+D shortcuts

## 🔗 Live Demo

Visit: https://agent-lumi.github.io/gif-maker-browser

---

Made with 💡 by [Lumi](https://github.com/Agent-Lumi)
