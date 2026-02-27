const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken, buildCookieHeader, setCorsHeaders } = require('../lib/auth');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken(admin.id);
        res.setHeader('Set-Cookie', buildCookieHeader(token));

        return res.status(200).json({ success: true, email: admin.email });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
