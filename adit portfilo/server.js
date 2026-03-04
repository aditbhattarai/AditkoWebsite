require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'adit-admin-secret-2026';

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(__dirname));

// ── Ensure uploads directory exists ───────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ── SQLite Database ────────────────────────────────────────────────
const db = new sqlite3.Database('./portfolio.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

// ── Password helpers (crypto, no bcrypt dependency) ───────────────
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const inputHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === inputHash;
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// In-memory session store  { token -> { email, role, expires } }
const sessions = {};

function createSession(email, role = 'admin') {
    const token = generateToken();
    sessions[token] = { email, role, expires: Date.now() + 8 * 60 * 60 * 1000 }; // 8 hours
    return token;
}

function validateSession(token) {
    const sess = sessions[token];
    if (!sess) return null;
    if (Date.now() > sess.expires) { delete sessions[token]; return null; }
    return sess;
}

// ── Create tables ─────────────────────────────────────────────────
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => {
        // Seed default admin from .env if no admin exists
        db.get('SELECT id FROM admin_users LIMIT 1', (err, row) => {
            if (!row) {
                const defaultEmail = process.env.ADMIN_EMAIL || 'admin@adit.dev';
                const defaultPass = process.env.ADMIN_PASSWORD || 'Admin@2026!';
                const hash = hashPassword(defaultPass);
                db.run('INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)',
                    [defaultEmail, hash, 'admin'], () => {
                        console.log(`\n✅  Default admin created`);
                        console.log(`    Email:    ${defaultEmail}`);
                        console.log(`    Password: ${defaultPass}`);
                        console.log('    ⚠️  Change this in your .env file!\n');
                    });
            }
        });
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => console.log('Contacts table ready'));

    db.run(`
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT,
            user_agent TEXT,
            page_visited TEXT,
            visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => console.log('Visitors table ready'));

    db.run(`
        CREATE TABLE IF NOT EXISTS works (
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
    `, () => console.log('Works table ready'));

    db.run(`
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            icon_url TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => console.log('Skills table ready'));

    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            excerpt TEXT,
            content TEXT,
            category TEXT DEFAULT 'General',
            status TEXT DEFAULT 'draft',
            image_url TEXT,
            tags TEXT,
            views INTEGER DEFAULT 0,
            author TEXT DEFAULT 'Adit Bhattarai',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => console.log('Posts table ready'));

    db.run(`
        CREATE TABLE IF NOT EXISTS media_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            original_name TEXT,
            url TEXT NOT NULL,
            size INTEGER,
            mime_type TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => console.log('Media table ready'));
}

// ── Auth middleware ────────────────────────────────────────────────
function requireAdmin(req, res, next) {
    // Support both old token-based auth AND new session tokens
    const headerToken = req.headers['x-admin-token'] || req.query.token;

    // Legacy token (still works for backwards compat)
    if (headerToken === ADMIN_TOKEN) { req.admin = { email: 'admin', role: 'admin' }; return next(); }

    // Session token
    const session = validateSession(headerToken);
    if (session) { req.admin = session; return next(); }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
}

// ── Email transporter ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
});

transporter.verify(function (error) {
    if (error) console.log('Email config error (notifications disabled):', error.message);
    else console.log('Email server ready');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Admin Authentication ───────────────────────────────────────────

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    db.get('SELECT * FROM admin_users WHERE email = ?', [email.trim().toLowerCase()], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const valid = verifyPassword(password, user.password_hash);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = createSession(user.email, user.role);
        res.json({ success: true, token, role: user.role, email: user.email });
    });
});

// POST /api/admin/logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const token = req.headers['x-admin-token'];
    if (sessions[token]) delete sessions[token];
    res.json({ success: true, message: 'Logged out' });
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Fields required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short (min 6)' });

    db.get('SELECT * FROM admin_users WHERE email = ?', [req.admin.email], (err, user) => {
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!verifyPassword(currentPassword, user.password_hash))
            return res.status(401).json({ success: false, message: 'Incorrect current password' });

        const newHash = hashPassword(newPassword);
        db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, user.id], function (err) {
            if (err) return res.status(500).json({ success: false, message: 'Error updating password' });
            res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});

// ── Hidden /admin route ────────────────────────────────────────────
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// ── Contact form ───────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
        return res.status(400).json({ success: false, message: 'All fields are required' });

    db.run(`INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
        [name, email, subject, message], function (err) {
            if (err) return res.status(500).json({ success: false, message: 'Error saving contact' });

            // Email notification
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER,
                subject: `New Contact: ${subject}`,
                html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p>${message}</p>`
            };
            transporter.sendMail(mailOptions, () => { });

            res.json({ success: true, message: 'Message received!', id: this.lastID });
        });
});

// GET /api/contacts (admin)
app.get('/api/contacts', requireAdmin, (req, res) => {
    db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, contacts: rows });
    });
});

// GET /api/contacts/:id (admin)
app.get('/api/contacts/:id', requireAdmin, (req, res) => {
    db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, contact: row });
    });
});

// DELETE /api/contacts/:id (admin)
app.delete('/api/contacts/:id', requireAdmin, (req, res) => {
    db.run('DELETE FROM contacts WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Deleted' });
    });
});

// ── Visitors ───────────────────────────────────────────────────────
app.post('/api/track-visit', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const page = req.body.page || '/';
    db.run(`INSERT INTO visitors (ip_address, user_agent, page_visited) VALUES (?, ?, ?)`,
        [ip, userAgent, page], () => res.json({ success: true }));
});

app.get('/api/stats', requireAdmin, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM visitors', [], (err, row) => {
        stats.totalVisits = row ? row.count : 0;
        db.get('SELECT COUNT(DISTINCT ip_address) as count FROM visitors', [], (err, row) => {
            stats.uniqueVisitors = row ? row.count : 0;
            db.get('SELECT COUNT(*) as count FROM contacts', [], (err, row) => {
                stats.totalContacts = row ? row.count : 0;
                db.all('SELECT * FROM visitors ORDER BY visited_at DESC LIMIT 10', [], (err, rows) => {
                    stats.recentVisits = rows || [];
                    res.json({ success: true, stats });
                });
            });
        });
    });
});

// ── Works ─────────────────────────────────────────────────────────
app.get('/api/works', (req, res) => {
    const { category, featured } = req.query;
    let sql = 'SELECT * FROM works'; const params = [];
    if (category || featured !== undefined) {
        const conds = [];
        if (category) { conds.push('category = ?'); params.push(category); }
        if (featured !== undefined) { conds.push('featured = ?'); params.push(featured === 'true' ? 1 : 0); }
        sql += ' WHERE ' + conds.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, works: rows });
    });
});

app.get('/api/works/:id', (req, res) => {
    db.get('SELECT * FROM works WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, work: row });
    });
});

app.post('/api/works', requireAdmin, (req, res) => {
    const { title, description, category, image_url, video_url, project_url, tags, featured } = req.body;
    if (!title || !category) return res.status(400).json({ success: false, message: 'Title and category required' });
    db.run(`INSERT INTO works (title, description, category, image_url, video_url, project_url, tags, featured) VALUES (?,?,?,?,?,?,?,?)`,
        [title, description, category, image_url, video_url, project_url, tags, featured ? 1 : 0],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/works/:id', requireAdmin, (req, res) => {
    const { title, description, category, image_url, video_url, project_url, tags, featured } = req.body;
    db.run(`UPDATE works SET title=?,description=?,category=?,image_url=?,video_url=?,project_url=?,tags=?,featured=? WHERE id=?`,
        [title, description, category, image_url, video_url, project_url, tags, featured ? 1 : 0, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
            res.json({ success: true });
        });
});

app.delete('/api/works/:id', requireAdmin, (req, res) => {
    db.run('DELETE FROM works WHERE id=?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true });
    });
});

// ── Blog Posts ────────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
    const { status, category } = req.query;
    let sql = 'SELECT * FROM posts'; const params = [];
    const conds = [];
    if (status) { conds.push('status = ?'); params.push(status); }
    if (category) { conds.push('category = ?'); params.push(category); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, posts: rows });
    });
});

app.get('/api/posts/:id', (req, res) => {
    db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: 'Not found' });
        // Increment view count
        db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true, post: row });
    });
});

app.post('/api/posts', requireAdmin, (req, res) => {
    const { title, excerpt, content, category, status, image_url, tags } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    db.run(`INSERT INTO posts (title, excerpt, content, category, status, image_url, tags) VALUES (?,?,?,?,?,?,?)`,
        [title, excerpt, content, category || 'General', status || 'draft', image_url, tags],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/posts/:id', requireAdmin, (req, res) => {
    const { title, excerpt, content, category, status, image_url, tags } = req.body;
    db.run(`UPDATE posts SET title=?,excerpt=?,content=?,category=?,status=?,image_url=?,tags=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [title, excerpt, content, category, status, image_url, tags, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
            res.json({ success: true });
        });
});

app.delete('/api/posts/:id', requireAdmin, (req, res) => {
    db.run('DELETE FROM posts WHERE id=?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true });
    });
});

// ── Skills ────────────────────────────────────────────────────────
app.get('/api/skills', (req, res) => {
    const { category } = req.query;
    let sql = 'SELECT * FROM skills'; const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY category, sort_order, name';
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, skills: rows });
    });
});

app.post('/api/skills', requireAdmin, (req, res) => {
    const { name, category, icon_url, sort_order } = req.body;
    if (!name || !category) return res.status(400).json({ success: false, message: 'name and category required' });
    db.run('INSERT INTO skills (name, category, icon_url, sort_order) VALUES (?,?,?,?)',
        [name, category, icon_url || '', sort_order || 0],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/skills/:id', requireAdmin, (req, res) => {
    const { name, category, icon_url, sort_order } = req.body;
    db.run('UPDATE skills SET name=?,category=?,icon_url=?,sort_order=? WHERE id=?',
        [name, category, icon_url, sort_order || 0, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
            res.json({ success: true });
        });
});

app.delete('/api/skills/:id', requireAdmin, (req, res) => {
    db.run('DELETE FROM skills WHERE id=?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true });
    });
});

// ── Media Upload (base64 JSON — no extra dependencies needed) ──────
// Frontend converts File → base64 and sends: { name, type, data: 'data:image/...;base64,...' }
app.post('/api/media/upload', requireAdmin, (req, res) => {
    const files = Array.isArray(req.body.files) ? req.body.files : [req.body];
    const uploadedFiles = [];
    let pending = files.length;

    if (!pending) return res.status(400).json({ success: false, message: 'No files provided' });

    files.forEach((fileObj) => {
        const { name: originalName, type: mimeType, data } = fileObj;
        if (!data || !data.startsWith('data:image/')) {
            pending--;
            if (pending === 0) res.json({ success: true, files: uploadedFiles });
            return;
        }
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
        const safeName = crypto.randomBytes(8).toString('hex') + '.' + ext;
        const filePath = path.join(UPLOADS_DIR, safeName);

        fs.writeFile(filePath, buffer, (err) => {
            if (err) { console.error('Write error:', err); pending--; if (pending === 0) res.json({ success: true, files: uploadedFiles }); return; }
            const url = `/uploads/${safeName}`;
            db.run('INSERT INTO media_files (name, original_name, url, size, mime_type) VALUES (?,?,?,?,?)',
                [safeName, originalName || safeName, url, buffer.length, mimeType], function (dbErr) {
                    if (!dbErr) uploadedFiles.push({ name: safeName, original_name: originalName, url, size: buffer.length });
                    pending--;
                    if (pending === 0) res.json({ success: true, files: uploadedFiles, message: `${uploadedFiles.length} file(s) uploaded` });
                });
        });
    });
});

// GET /api/media (list)
app.get('/api/media', requireAdmin, (req, res) => {
    db.all('SELECT * FROM media_files ORDER BY uploaded_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, files: rows });
    });
});

// DELETE /api/media/:name
app.delete('/api/media/:name', requireAdmin, (req, res) => {
    const name = req.params.name;
    db.get('SELECT * FROM media_files WHERE name = ?', [name], (err, row) => {
        if (!row) return res.status(404).json({ success: false, message: 'File not found' });
        const filePath = path.join(UPLOADS_DIR, name);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        db.run('DELETE FROM media_files WHERE name = ?', [name], function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'File deleted' });
        });
    });
});

// ── Static routes ─────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'blog.html')));

// ── 404 catch-all (must be last) ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/admin`);
    console.log(`📊 API: http://localhost:${PORT}/api\n`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error('Error closing database:', err.message);
        else console.log('Database closed');
        process.exit(0);
    });
});
