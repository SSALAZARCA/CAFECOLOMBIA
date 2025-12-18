const express = require('express');
const router = express.Router();
const { dbConfig, pool } = require('../../config/database.cjs');
const mysql = require('mysql2/promise');
const { errorHandler, asyncErrorHandler, validateRequest } = require('../../lib/errorHandler.cjs');

// GET /api/market-prices - Get all prices (filtered by date/limit if needed)
router.get('/', asyncErrorHandler(async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Basic limit for safety
        const [rows] = await connection.execute(
            'SELECT * FROM market_prices ORDER BY date DESC LIMIT 50'
        );
        await connection.end();
        res.json(rows); // Return array directly to match common patterns
    } catch (error) {
        if (connection) await connection.end();
        throw error;
    }
}));

// POST /api/market-prices - Create new price
router.post('/', asyncErrorHandler(async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { date, price, source, coffeeType, region, notes, serverId } = req.body;

        // If serverId provided (from some syncs), ignore or use? Usually DB generates ID.
        // We'll standard insert.
        const [result] = await connection.execute(
            `INSERT INTO market_prices (date, price, source, coffee_type, region, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [date, price, source, coffeeType || 'Standard', region || 'Local', notes || '']
        );

        const newId = result.insertId;
        await connection.end();

        res.status(201).json({
            success: true,
            id: newId,
            message: 'Precio registrado en servidor'
        });
    } catch (error) {
        if (connection) await connection.end();
        throw error;
    }
}));

// PUT /api/market-prices/:id - Update
router.put('/:id', asyncErrorHandler(async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { price, source, notes } = req.body;

        await connection.execute(
            'UPDATE market_prices SET price = ?, source = ?, notes = ? WHERE id = ?',
            [price, source, notes, id]
        );

        await connection.end();
        res.json({ success: true, message: 'Precio actualizado' });
    } catch (error) {
        if (connection) await connection.end();
        throw error;
    }
}));

// DELETE /api/market-prices/:id
router.delete('/:id', asyncErrorHandler(async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        await connection.execute('DELETE FROM market_prices WHERE id = ?', [id]);
        await connection.end();
        res.json({ success: true, message: 'Precio eliminado' });
    } catch (error) {
        if (connection) await connection.end();
        throw error;
    }
}));

module.exports = router;
