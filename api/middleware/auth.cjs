const jwt = require('jsonwebtoken');
const { pool } = require('../config/database.cjs');

const createError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
        }

        // Determine secret key
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ success: false, error: 'Server configuration error: JWT_SECRET missing' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (e) {
            // Fallback for demo tokens or specific grower tokens if they aren't real JWTs
            if (token.startsWith('grower-token-')) {
                const email = token.replace('grower-token-', '');
                decoded = { email, role: 'coffee_grower', isDemo: true };
            } else if (token.startsWith('user-token-')) {
                // Extract ID if possible or fail
                return res.status(401).json({ success: false, error: 'Token inválido' });
            } else {
                return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
            }
        }

        const connection = await pool.getConnection();
        try {
            let user;
            if (decoded.email) {
                // Demo/Grower token flow
                const [users] = await connection.execute(
                    'SELECT id, email, role, firstName, lastName FROM users WHERE email = ? AND isActive = 1',
                    [decoded.email]
                );
                if (users.length > 0) user = users[0];
            } else if (decoded.userId) {
                // Standard JWT flow
                const [users] = await connection.execute(
                    'SELECT id, email, role, firstName, lastName FROM users WHERE id = ? AND isActive = 1',
                    [decoded.userId]
                );
                if (users.length > 0) user = users[0];
            }

            if (!user) {
                const fs = require('fs');
                try {
                    fs.appendFileSync('backend-errors.log', new Date().toISOString() + ` AUTH FAIL: User not found for ${JSON.stringify(decoded)}\n`);
                } catch (e) { }
                return res.status(401).json({ success: false, error: 'Usuario no encontrado o inactivo' });
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`
            };

            next();

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Auth error:', error);
        const fs = require('fs');
        try {
            fs.appendFileSync('backend-errors.log', new Date().toISOString() + ' AUTH ERROR: ' + error.message + '\n');
        } catch (e) { }
        return res.status(500).json({ success: false, error: 'Error de autenticación interna' });
    }
};

module.exports = {
    authenticateToken
};
