const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'admin_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

/**
 * Sign a JWT for the given admin ID
 */
function signToken(adminId) {
    return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

/**
 * Verify and decode a JWT
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

/**
 * Parse cookies from request header
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach((c) => {
        const [key, ...val] = c.split('=');
        if (key) cookies[key.trim()] = val.join('=').trim();
    });
    return cookies;
}

/**
 * Build a Set-Cookie header string for the auth token
 */
function buildCookieHeader(token) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${TOKEN_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${TOKEN_MAX_AGE}${secure}`;
}

/**
 * Build a Set-Cookie header to clear the auth token
 */
function clearCookieHeader() {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${TOKEN_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`;
}

/**
 * Middleware: verify auth from cookies. Returns decoded payload or null.
 */
function authenticate(req) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[TOKEN_NAME];
    if (!token) return null;
    return verifyToken(token);
}

/**
 * Standard JSON error response
 */
function unauthorized(res) {
    return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * CORS headers for API routes
 */
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
    signToken,
    verifyToken,
    parseCookies,
    buildCookieHeader,
    clearCookieHeader,
    authenticate,
    unauthorized,
    setCorsHeaders,
    TOKEN_NAME,
};
