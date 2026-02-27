const { clearCookieHeader, setCorsHeaders } = require('../lib/auth');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    res.setHeader('Set-Cookie', clearCookieHeader());
    return res.status(200).json({ success: true });
};
