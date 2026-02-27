const prisma = require('../lib/prisma');
const { authenticate, unauthorized, setCorsHeaders } = require('../lib/auth');

module.exports = async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Auth required
    const user = authenticate(req);
    if (!user) return unauthorized(res);

    if (req.method === 'GET') {
        try {
            const messages = await prisma.message.findMany({
                orderBy: { createdAt: 'desc' },
            });

            const total = messages.length;
            const unread = messages.filter((m) => !m.read).length;
            const read = total - unread;

            return res.status(200).json({ messages, stats: { total, unread, read } });
        } catch (error) {
            console.error('Messages GET error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PATCH — mark as read
    if (req.method === 'PATCH') {
        try {
            const { id } = req.body || {};
            if (!id) return res.status(400).json({ error: 'Message ID required' });

            await prisma.message.update({
                where: { id },
                data: { read: true },
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Messages PATCH error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE
    if (req.method === 'DELETE') {
        try {
            const { id } = req.body || {};
            if (!id) return res.status(400).json({ error: 'Message ID required' });

            await prisma.message.delete({ where: { id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Messages DELETE error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
