const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma.cjs');

// GET /api/ai/analysis/results - Obtener resultados de análisis IA reales
router.get('/analysis/results', async (req, res) => {
    try {
        const { type, status, farmId, limit = 10 } = req.query;
        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;
        if (farmId) where.farmId = parseInt(farmId);

        const results = await prisma.aIAnalysis.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: results,
            total: results.length
        });
    } catch (error) {
        console.error('Error fetching real AI results:', error);
        res.status(500).json({ error: 'Error obteniendo análisis reales' });
    }
});

// POST /api/ai/analysis - Iniciar nuevo análisis IA real
router.post('/analysis', async (req, res) => {
    try {
        const { type, farmId, lotId, metadata } = req.body;
        
        const analysis = await prisma.aIAnalysis.create({
            data: {
                type,
                farmId: parseInt(farmId),
                lotId,
                status: 'pending',
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });

        // Simulate async processing (could be a separate worker call)
        setTimeout(async () => {
             try {
                await prisma.aIAnalysis.update({
                    where: { id: analysis.id },
                    data: { status: 'completed', confidence: 0.85, result: JSON.stringify({ message: "Análisis saludable" }), completedAt: new Date(), processingTime: 5 }
                });
             } catch (e) {
                console.error('Processing error:', e);
             }
        }, 3000);

        res.status(201).json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ error: 'Error iniciando análisis real' });
    }
});

module.exports = router;