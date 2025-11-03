import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log de la request entrante
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Interceptar la respuesta para loggear cuando termine
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} ${statusColor} - ${duration}ms`);
    
    // Si hay error, loggear más detalles
    if (res.statusCode >= 400) {
      console.log(`   Error details: ${body}`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};