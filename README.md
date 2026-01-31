# Ayush Ghosh - AI Product Leader Portfolio

A modern, responsive portfolio website built with React, featuring SEO optimization, dark mode, analytics tracking, and comprehensive error handling.

## 🚀 Quick Start

### Development (Recommended)
```bash
cd /path/to/ghosh-ayush.github.io
python3 -m http.server 8000
```
Visit: `http://localhost:8000`

### Production Build (Optional)
```bash
npm install
npm run build
npm run serve
```

## 📁 Project Structure

```
ghosh-ayush.github.io/
├── index.html                    # Main React application (2500+ lines)
├── portfolio-data.json           # Single source of truth for all content
├── favicon.svg                   # Site favicon with gradient logo
│
├── assets/                       # Static assets
│   ├── css/                     # Stylesheets (Swiper)
│   ├── js/                      # Libraries (Swiper)
│   └── images/                  # Project/company logos
│
├── documents/                    # Downloadable files
│   └── resume.pdf               # Resume for download button
│
└── Configuration Files
    ├── vite.config.js           # Optional Vite build config
    ├── package.json             # Dev dependencies
    ├── package-lock.json        # Dependency lock file
    └── README.md                # This file
```

## ✨ Features

### Core
- ✅ **React 18** with Babel standalone (zero-build dev mode)
- ✅ **JSON-Driven Architecture** - Single `portfolio-data.json` file
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized
- ✅ **Dark Mode** - Toggle with localStorage persistence
- ✅ **Animations** - Scroll-based fade-in effects, hover interactions

### Performance & SEO
- 📊 **SEO Meta Tags** - Title, description, Open Graph, Twitter Card, JSON-LD
- 🖼️ **Image Lazy Loading** - Native browser lazy loading on images
- 🏎️ **Optimized Build** - Optional Vite production (70% smaller)
- 📥 **Resume Download** - Direct PDF download from hero section

### User Experience
- 🌙 **Dark Mode Toggle** - Smooth theme switching
- 📱 **Responsive Navigation** - Fixed header with scroll detection
- ♿ **Accessibility** - ARIA labels, keyboard navigation, reduced motion support
- ✉️ **Contact Options** - Email, Calendly, LinkedIn links

### Monitoring & Reliability
- 📊 **Google Analytics 4** - Event tracking for user behavior
- 🚨 **Error Boundaries** - React error handling with fallback UI
- ✔️ **Data Validation** - Portfolio data structure validation
- 📈 **Event Tracking** - Page views, clicks, scroll depth, section views

## 🎯 Key Components

### PortfolioApp (Main Component)
- Data loading with validation
- Dark mode state management
- Error boundary wrapper
- Analytics initialization

### Navigation
- Smooth scroll to sections
- Dark mode toggle button
- Analytics tracking on nav clicks

### Hero Section
- Animated profile image
- Gradient text effects
- Social media links
- **Download Resume button**

### Experience Section
- Alternating timeline layout
- Company logos
- Job descriptions with bullets
- Timeline styling

### Projects Section
- Grid layout with hover effects
- Project images (lazy loaded)
- Tags and descriptions
- Project links with analytics

### Skills Section
- Non-technical (leadership, strategy)
- Technical (languages, frameworks)
- Grid-based layout

### Education Section
- Degrees with institution logos
- Certifications with issuer logos
- GPA and highlights

### Testimonials Section
- Carousel/grid layout
- Star ratings
- Author names and titles

## 📊 Data Source

All content comes from `portfolio-data.json`:

```json
{
  "personal": { /* name, bio, email, etc */ },
  "experience": [ /* jobs with companies, logos, dates */ ],
  "projects": [ /* portfolio projects with images, tags */ ],
  "skills": { /* technical and non-technical */ },
  "education": { /* degrees, certifications */ },
  "social": [ /* LinkedIn, GitHub, etc */ ],
  "testimonials": [ /* quotes from colleagues */ ]
}
```

**To update the portfolio:** Simply edit `portfolio-data.json`. Changes appear automatically on reload!

## 🔧 Configuration

### Update Resume
Replace `/documents/resume.pdf` with your new resume file. The download button automatically uses the latest version.

### Update GA4 ID
In `index.html`, find the Google Analytics script (~line 92):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V4F5XVFQY8"></script>
```
Replace `G-V4F5XVFQY8` with your GA4 ID.

### Production Build
```bash
npm install --save-dev vite @vitejs/plugin-react terser
npm run build  # Creates dist/ folder
npm run serve  # Preview production build
```

## 📚 Documentation

- [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md) - Google Analytics 4 guide
- [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) - Production build setup
- [ERROR_HANDLING.md](ERROR_HANDLING.md) - Error boundary & validation details

## 🎨 Styling

### CSS Variables (Light Mode)
```css
--bg-primary: #ffffff
--text-primary: #1a1a1a
--border-color: #e0e0e0
--card-shadow: 0 4px 20px rgba(0,0,0,0.08)
```

### CSS Variables (Dark Mode)
Automatically overridden when `body.dark-mode` class is applied.

### Animations
- `fadeInUp` - Vertical slide in
- `fadeInLeft` / `fadeInRight` - Horizontal slide in
- `float` - Subtle floating effect
- `spin` - Loading spinner rotation
- `pulse` - Pulse animation for highlights

## 🔄 Workflow

### Adding New Content
1. Edit `portfolio-data.json` with new projects/experience
2. Refresh browser to see changes immediately

### Updating Styling
Edit CSS in `index.html` `<style>` section. All CSS variables respect dark mode.

### Deploying to GitHub Pages
```bash
git add -A
git commit -m "Update portfolio"
git push origin main
```
(Requires GitHub Pages enabled in repo settings)

## 🛠️ Built With

- **React 18** - UI framework
- **Babel Standalone** - Runtime JSX compilation
- **Vite** - Optional production bundler
- **Google Analytics 4** - User analytics
- **CSS3** - Animations and gradients
- **Intersection Observer** - Scroll detection

## 📋 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 10+)

## 🚀 Performance

- **Dev Version** (~450KB uncompressed)
- **Prod Version** (~120KB minified + gzipped)
- **Lazy Loading** - Images load on viewport entry
- **Code Splitting** - Optional for production build

## 🔐 Privacy

- ✅ Google Analytics with IP anonymization
- ✅ No personal data collection
- ✅ No third-party trackers (except GA)
- ✅ GDPR friendly (analytics optional)

## 📝 License

Personal portfolio - All rights reserved

## 👤 Author

**Ayush Ghosh**  
AI Product Leader | UIUC | Chicago, IL

---

**Last Updated:** January 30, 2026  
**Status:** Production Ready ✅

