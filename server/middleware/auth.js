// server/middleware/auth.js

const ALLOWED_IPS = ['::1', '127.0.0.1'];
const OFFICE_IP = '192.168.1.50'; // Simulated Office IP

const authMiddleware = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const normalizedIp = clientIp.includes('::ffff:') ? clientIp.split('::ffff:')[1] : clientIp;

    console.log(`[Access Log] ${req.method} ${req.path} - ${normalizedIp}`);

    // Simple Role Assignment
    if (ALLOWED_IPS.includes(normalizedIp) || normalizedIp === 'localhost') {
        req.userRole = 'admin';
    } else if (normalizedIp === OFFICE_IP) {
        req.userRole = 'restricted';
        // Block dangerous methods from Office PC
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            return res.status(403).json({ error: 'Write access denied from Office PC.' });
        }
    } else {
        // Default to restricted for others (Tunnel users)
        req.userRole = 'restricted';
    }

    next();
};

module.exports = { authMiddleware };
