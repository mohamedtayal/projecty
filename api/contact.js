const prisma = require('../lib/prisma');
const { setCorsHeaders } = require('../lib/auth');

// Simple in-memory rate limiting (per serverless instance)
const rateMap = new Map();
const RATE_LIMIT = 5;      // max requests
const RATE_WINDOW = 60000; // per minute

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW) {
        rateMap.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '').slice(0, 1000);
}

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limit
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    try {
        const { name, email, phone, company, subject, budget, message } = req.body || {};

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields: name, email, subject, message' });
        }
        if (typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        if (typeof message !== 'string' || message.trim().length < 10) {
            return res.status(400).json({ error: 'Message must be at least 10 characters' });
        }

        // Save to database
        const newMessage = await prisma.message.create({
            data: {
                name: sanitize(name),
                email: sanitize(email),
                phone: sanitize(phone || ''),
                company: sanitize(company || ''),
                subject: sanitize(subject),
                budget: sanitize(budget || ''),
                message: sanitize(message),
            },
        });

        // Send email notification (non-blocking)
        sendNotification(newMessage).catch((err) => console.error('Email error:', err));

        return res.status(201).json({ success: true, id: newMessage.id });
    } catch (error) {
        console.error('Contact API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

async function sendNotification(msg) {
    const apiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (!apiKey || !notifyEmail) return;

    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
        from: 'Portfolio <onboarding@resend.dev>',
        to: notifyEmail,
        subject: `New Contact: ${msg.subject} — from ${msg.name}`,
        html: `
      <h2>New Portfolio Message</h2>
      <p><strong>From:</strong> ${msg.name} (${msg.email})</p>
      <p><strong>Phone:</strong> ${msg.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${msg.company || 'N/A'}</p>
      <p><strong>Subject:</strong> ${msg.subject}</p>
      <p><strong>Budget:</strong> ${msg.budget || 'N/A'}</p>
      <hr>
      <p>${msg.message}</p>
    `,
    });
}
