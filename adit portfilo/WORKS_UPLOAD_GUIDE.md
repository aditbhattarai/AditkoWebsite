# 🎨 Portfolio Works Upload Feature - Documentation

## ✅ What's New

### 1. **Video Editing Service Added**
- ✅ Video Editing is now the **first service** displayed
- ✅ All service cards are now **clickable**
- ✅ Clicking a service scrolls to the contact form
- ✅ Subject field is **auto-filled** with the selected service

### 2. **Works Upload System**
A complete portfolio management system where you can upload and manage your work!

## 🚀 How to Use

### Access the Upload Page

Visit: **http://localhost:3000/upload-works.html**

### Upload Your Work

1. **Fill in the form:**
   - **Title*** (required) - Name of your project
   - **Category*** (required) - Choose from:
     - Video Editing
     - Web Development
     - Mobile App
     - UI/UX Design
     - Backend Development
     - Other
   - **Description** - Describe your project
   - **Image URL** - Link to project screenshot/thumbnail
   - **Video URL** - YouTube, Vimeo, or other video link
   - **Project URL** - Link to live demo or repository
   - **Tags** - Comma-separated (e.g., "React, Node.js, MongoDB")
   - **Featured** - Check to feature this work

2. **Click "Save Work"**

3. **Your work appears in the grid below!**

## 📊 Features

### Upload Page Features
- ✅ **Add new works** with images, videos, and links
- ✅ **Edit existing works** - click "Edit" button
- ✅ **Delete works** - click "Delete" button
- ✅ **Filter by category** - dropdown filter
- ✅ **Filter featured works** - show only featured items
- ✅ **Auto-refresh** - click refresh button
- ✅ **Beautiful cards** - featured works have gold border
- ✅ **Responsive design** - works on all devices

### Service Cards (Homepage)
- ✅ **Video Editing first** - prioritized position
- ✅ **Clickable cards** - entire card is clickable
- ✅ **Contact Me button** - clear call-to-action
- ✅ **Auto-fill subject** - pre-fills contact form
- ✅ **Smooth scroll** - animated scroll to contact

## 🗄️ Database

### Works Table Structure
```sql
CREATE TABLE works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    project_url TEXT,
    tags TEXT,
    featured BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 🔌 API Endpoints

### Get All Works
```
GET /api/works
Query params: ?category=Video Editing&featured=true
```

### Get Single Work
```
GET /api/works/:id
```

### Create Work
```
POST /api/works
Body: {
  "title": "My Video Project",
  "description": "Amazing video editing work",
  "category": "Video Editing",
  "image_url": "https://...",
  "video_url": "https://youtube.com/...",
  "project_url": "https://...",
  "tags": "DaVinci Resolve, Motion Graphics",
  "featured": true
}
```

### Update Work
```
PUT /api/works/:id
Body: { ...same as create... }
```

### Delete Work
```
DELETE /api/works/:id
```

## 📸 Image Hosting Options

Since you're uploading image URLs, you'll need to host images somewhere. Here are free options:

### Recommended Services:
1. **Imgur** - https://imgur.com
   - Free, no account needed
   - Direct image links
   - Easy to use

2. **Cloudinary** - https://cloudinary.com
   - Free tier: 25GB storage
   - Image optimization
   - Professional features

3. **ImgBB** - https://imgbb.com
   - Free, simple
   - Direct links
   - No account required

4. **GitHub** - https://github.com
   - Free with repository
   - Reliable hosting
   - Version control

### How to Upload Images:

#### Option 1: Imgur (Easiest)
1. Go to https://imgur.com
2. Click "New post"
3. Upload your image
4. Right-click image → "Copy image address"
5. Paste URL in the "Image URL" field

#### Option 2: Cloudinary
1. Sign up at https://cloudinary.com
2. Upload image to Media Library
3. Click image → Copy URL
4. Paste in "Image URL" field

#### Option 3: GitHub
1. Create a repository
2. Upload images to a folder (e.g., `/images`)
3. View image → Right-click → "Copy image address"
4. Use the raw GitHub URL

## 🎬 Video Hosting

For videos, use:
- **YouTube** - https://youtube.com
- **Vimeo** - https://vimeo.com
- **Google Drive** - Share link
- **Dropbox** - Share link

## 💡 Usage Examples

### Example 1: Video Editing Project
```json
{
  "title": "Corporate Promo Video",
  "description": "Professional corporate video with motion graphics and color grading",
  "category": "Video Editing",
  "image_url": "https://i.imgur.com/abc123.jpg",
  "video_url": "https://youtube.com/watch?v=abc123",
  "tags": "DaVinci Resolve, Motion Graphics, Color Grading",
  "featured": true
}
```

### Example 2: Web Development Project
```json
{
  "title": "E-Commerce Website",
  "description": "Full-stack e-commerce platform with payment integration",
  "category": "Web Development",
  "image_url": "https://i.imgur.com/xyz789.jpg",
  "project_url": "https://demo-store.com",
  "tags": "React, Node.js, MongoDB, Stripe",
  "featured": false
}
```

## 🎯 Service Card Interaction

When users click on a service card:

1. **Page scrolls** smoothly to contact section
2. **Subject field** auto-fills with: "Inquiry about [Service Name]"
3. **Field focuses** for immediate typing
4. **User can** modify the subject or fill other fields

Example:
- Click "Video Editing" → Subject becomes "Inquiry about Video Editing"
- Click "Web Development" → Subject becomes "Inquiry about Web Development"

## 📱 Access Points

| Page | URL | Purpose |
|------|-----|---------|
| **Portfolio** | http://localhost:3000 | Main website |
| **Upload Works** | http://localhost:3000/upload-works.html | Manage portfolio |
| **Admin Dashboard** | http://localhost:3000/admin.html | View contacts |
| **Works API** | http://localhost:3000/api/works | JSON data |

## 🎨 Categories Available

1. **Video Editing** - DaVinci Resolve projects, motion graphics
2. **Web Development** - Websites, web apps
3. **Mobile App** - iOS, Android apps
4. **UI/UX Design** - Interface designs, prototypes
5. **Backend Development** - APIs, servers, databases
6. **Other** - Anything else

## ⭐ Featured Works

- Check the "Featured" checkbox to highlight important works
- Featured works get a **gold border** and special badge
- Filter to show only featured works
- Great for showcasing your best projects

## 🔄 Workflow

### Adding a New Video Editing Project:

1. **Create/Edit your video** in DaVinci Resolve
2. **Export and upload** to YouTube/Vimeo
3. **Take a screenshot** of your best frame
4. **Upload screenshot** to Imgur
5. **Go to** http://localhost:3000/upload-works.html
6. **Fill in the form:**
   - Title: "Corporate Promo 2026"
   - Category: Video Editing
   - Description: "Professional corporate video..."
   - Image URL: [Imgur link]
   - Video URL: [YouTube link]
   - Tags: "DaVinci Resolve, Motion Graphics"
   - Check "Featured" if it's your best work
7. **Click "Save Work"**
8. **Done!** Your work is now in your portfolio

## 🎊 Benefits

### For You:
- ✅ Easy portfolio management
- ✅ No coding needed to add works
- ✅ Edit/delete anytime
- ✅ Filter and organize
- ✅ Professional presentation

### For Visitors:
- ✅ See your best work
- ✅ Watch video demos
- ✅ Visit live projects
- ✅ Easy contact for services
- ✅ Clear service offerings

## 🚀 Next Steps

1. **Start the server**: `npm start`
2. **Visit upload page**: http://localhost:3000/upload-works.html
3. **Add your first work**
4. **Test service cards** on homepage
5. **Share your portfolio!**

## 📝 Tips

- Use **high-quality images** for better presentation
- Write **clear descriptions** of your work
- Add **relevant tags** for categorization
- **Feature your best** 3-5 projects
- Keep **video URLs** public and accessible
- Update **regularly** with new projects

---

**Your portfolio is now a complete showcase platform! 🎉**
