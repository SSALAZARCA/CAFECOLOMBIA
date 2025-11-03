import { executeQuery } from '../config/database.js';
import type { 
  DashboardMetrics,
  DashboardChartData,
  DashboardRecentActivity,
  DashboardSystemHealth,
  DashboardTopMetrics
} from '../../shared/types/index.js';

export class AdminDashboardService {
  /**
   * Obtener métricas principales del dashboard
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const queries = {
      // Usuarios
      totalUsers: `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`,
      activeUsers: `SELECT COUNT(*) as count FROM users WHERE status = 'active' AND deleted_at IS NULL`,
      newUsersThisMonth: `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE YEAR(created_at) = YEAR(CURDATE()) 
        AND MONTH(created_at) = MONTH(CURDATE())
        AND deleted_at IS NULL
      `,
      
      // Caficultores
      totalCoffeeGrowers: `SELECT COUNT(*) as count FROM coffee_growers WHERE deleted_at IS NULL`,
      activeCoffeeGrowers: `SELECT COUNT(*) as count FROM coffee_growers WHERE status = 'active' AND deleted_at IS NULL`,
      newCoffeeGrowersThisMonth: `
        SELECT COUNT(*) as count 
        FROM coffee_growers 
        WHERE YEAR(created_at) = YEAR(CURDATE()) 
        AND MONTH(created_at) = MONTH(CURDATE())
        AND deleted_at IS NULL
      `,
      
      // Fincas
      totalFarms: `SELECT COUNT(*) as count FROM farms WHERE deleted_at IS NULL`,
      activeFarms: `SELECT COUNT(*) as count FROM farms WHERE status = 'active' AND deleted_at IS NULL`,
      totalCoffeeArea: `SELECT COALESCE(SUM(coffee_area), 0) as total FROM farms WHERE deleted_at IS NULL`,
      
      // Suscripciones
      totalSubscriptions: `SELECT COUNT(*) as count FROM subscriptions`,
      activeSubscriptions: `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`,
      subscriptionRevenue: `
        SELECT COALESCE(SUM(price), 0) as total 
        FROM subscriptions 
        WHERE status = 'active'
      `,
      
      // Pagos
      totalPayments: `SELECT COUNT(*) as count FROM payments`,
      successfulPayments: `SELECT COUNT(*) as count FROM payments WHERE status = 'completed'`,
      totalRevenue: `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`,
      revenueThisMonth: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE status = 'completed'
        AND YEAR(created_at) = YEAR(CURDATE()) 
        AND MONTH(created_at) = MONTH(CURDATE())
      `,
      
      // Actividad del sistema
      auditLogsToday: `
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE DATE(created_at) = CURDATE()
      `,
      
      // Crecimiento mensual
      userGrowth: `
        SELECT 
          COALESCE(
            (SELECT COUNT(*) FROM users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND deleted_at IS NULL) -
            (SELECT COUNT(*) FROM users WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND deleted_at IS NULL),
            0
          ) as growth
      `,
      
      revenueGrowth: `
        SELECT 
          COALESCE(
            (SELECT SUM(amount) FROM payments WHERE status = 'completed' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())) -
            (SELECT SUM(amount) FROM payments WHERE status = 'completed' AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))),
            0
          ) as growth
      `
    };

    const [
      totalUsersResult,
      activeUsersResult,
      newUsersThisMonthResult,
      totalCoffeeGrowersResult,
      activeCoffeeGrowersResult,
      newCoffeeGrowersThisMonthResult,
      totalFarmsResult,
      activeFarmsResult,
      totalCoffeeAreaResult,
      totalSubscriptionsResult,
      activeSubscriptionsResult,
      subscriptionRevenueResult,
      totalPaymentsResult,
      successfulPaymentsResult,
      totalRevenueResult,
      revenueThisMonthResult,
      auditLogsTodayResult,
      userGrowthResult,
      revenueGrowthResult
    ] = await Promise.all([
      executeQuery(queries.totalUsers),
      executeQuery(queries.activeUsers),
      executeQuery(queries.newUsersThisMonth),
      executeQuery(queries.totalCoffeeGrowers),
      executeQuery(queries.activeCoffeeGrowers),
      executeQuery(queries.newCoffeeGrowersThisMonth),
      executeQuery(queries.totalFarms),
      executeQuery(queries.activeFarms),
      executeQuery(queries.totalCoffeeArea),
      executeQuery(queries.totalSubscriptions),
      executeQuery(queries.activeSubscriptions),
      executeQuery(queries.subscriptionRevenue),
      executeQuery(queries.totalPayments),
      executeQuery(queries.successfulPayments),
      executeQuery(queries.totalRevenue),
      executeQuery(queries.revenueThisMonth),
      executeQuery(queries.auditLogsToday),
      executeQuery(queries.userGrowth),
      executeQuery(queries.revenueGrowth)
    ]);

    return {
      users: {
        total: totalUsersResult[0].count,
        active: activeUsersResult[0].count,
        new_this_month: newUsersThisMonthResult[0].count,
        growth_rate: userGrowthResult[0].growth
      },
      coffee_growers: {
        total: totalCoffeeGrowersResult[0].count,
        active: activeCoffeeGrowersResult[0].count,
        new_this_month: newCoffeeGrowersThisMonthResult[0].count
      },
      farms: {
        total: totalFarmsResult[0].count,
        active: activeFarmsResult[0].count,
        total_coffee_area: parseFloat(totalCoffeeAreaResult[0].total)
      },
      subscriptions: {
        total: totalSubscriptionsResult[0].count,
        active: activeSubscriptionsResult[0].count,
        monthly_revenue: parseFloat(subscriptionRevenueResult[0].total)
      },
      payments: {
        total: totalPaymentsResult[0].count,
        successful: successfulPaymentsResult[0].count,
        total_revenue: parseFloat(totalRevenueResult[0].total),
        revenue_this_month: parseFloat(revenueThisMonthResult[0].total),
        revenue_growth: revenueGrowthResult[0].growth
      },
      system: {
        audit_logs_today: auditLogsTodayResult[0].count
      }
    };
  }

  /**
   * Obtener datos para gráficos del dashboard
   */
  static async getDashboardChartData(): Promise<DashboardChartData> {
    const queries = {
      // Registros de usuarios por mes (últimos 12 meses)
      userRegistrations: `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND deleted_at IS NULL
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `,
      
      // Ingresos por mes (últimos 12 meses)
      monthlyRevenue: `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          SUM(amount) as revenue
        FROM payments
        WHERE status = 'completed'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `,
      
      // Distribución de suscripciones por plan
      subscriptionsByPlan: `
        SELECT 
          sp.name as plan_name,
          COUNT(s.id) as count
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        WHERE sp.deleted_at IS NULL
        GROUP BY sp.id, sp.name
        ORDER BY count DESC
      `,
      
      // Métodos de pago más utilizados
      paymentMethods: `
        SELECT 
          method,
          COUNT(*) as count
        FROM payments
        WHERE status = 'completed'
        GROUP BY method
        ORDER BY count DESC
      `,
      
      // Actividad diaria (últimos 30 días)
      dailyActivity: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      
      // Crecimiento de caficultores por departamento
      growersByDepartment: `
        SELECT 
          department,
          COUNT(*) as count
        FROM coffee_growers
        WHERE deleted_at IS NULL
        GROUP BY department
        ORDER BY count DESC
        LIMIT 10
      `
    };

    const [
      userRegistrationsResult,
      monthlyRevenueResult,
      subscriptionsByPlanResult,
      paymentMethodsResult,
      dailyActivityResult,
      growersByDepartmentResult
    ] = await Promise.all([
      executeQuery(queries.userRegistrations),
      executeQuery(queries.monthlyRevenue),
      executeQuery(queries.subscriptionsByPlan),
      executeQuery(queries.paymentMethods),
      executeQuery(queries.dailyActivity),
      executeQuery(queries.growersByDepartment)
    ]);

    return {
      user_registrations: userRegistrationsResult.map((item: any) => ({
        month: item.month,
        count: item.count
      })),
      monthly_revenue: monthlyRevenueResult.map((item: any) => ({
        month: item.month,
        revenue: parseFloat(item.revenue)
      })),
      subscriptions_by_plan: subscriptionsByPlanResult.map((item: any) => ({
        plan_name: item.plan_name,
        count: item.count
      })),
      payment_methods: paymentMethodsResult.map((item: any) => ({
        method: item.method,
        count: item.count
      })),
      daily_activity: dailyActivityResult.map((item: any) => ({
        date: item.date,
        count: item.count
      })),
      growers_by_department: growersByDepartmentResult.map((item: any) => ({
        department: item.department,
        count: item.count
      }))
    };
  }

  /**
   * Obtener actividad reciente del sistema
   */
  static async getRecentActivity(): Promise<DashboardRecentActivity[]> {
    const query = `
      SELECT 
        al.id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.description,
        al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `;

    const result = await executeQuery(query);

    return result.map((item: any) => ({
      id: item.id,
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      description: item.description,
      created_at: item.created_at,
      user_name: item.user_name,
      user_role: item.user_role
    }));
  }

  /**
   * Obtener estado de salud del sistema
   */
  static async getSystemHealth(): Promise<DashboardSystemHealth> {
    const queries = {
      // Errores en las últimas 24 horas
      recentErrors: `
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE action = 'error'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `,
      
      // Pagos fallidos en las últimas 24 horas
      failedPayments: `
        SELECT COUNT(*) as count
        FROM payments
        WHERE status = 'failed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `,
      
      // Suscripciones que expiran en los próximos 7 días
      expiringSoon: `
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
        AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `,
      
      // Usuarios inactivos (sin actividad en 30 días)
      inactiveUsers: `
        SELECT COUNT(*) as count
        FROM users u
        WHERE u.deleted_at IS NULL
        AND u.last_login_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      
      // Tamaño de la base de datos (aproximado)
      databaseSize: `
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `
    };

    const [
      recentErrorsResult,
      failedPaymentsResult,
      expiringSoonResult,
      inactiveUsersResult,
      databaseSizeResult
    ] = await Promise.all([
      executeQuery(queries.recentErrors),
      executeQuery(queries.failedPayments),
      executeQuery(queries.expiringSoon),
      executeQuery(queries.inactiveUsers),
      executeQuery(queries.databaseSize)
    ]);

    return {
      recent_errors: recentErrorsResult[0].count,
      failed_payments_24h: failedPaymentsResult[0].count,
      subscriptions_expiring_soon: expiringSoonResult[0].count,
      inactive_users: inactiveUsersResult[0].count,
      database_size_mb: parseFloat(databaseSizeResult[0].size_mb || 0),
      status: 'healthy' // Se puede implementar lógica más compleja aquí
    };
  }

  /**
   * Obtener métricas principales destacadas
   */
  static async getTopMetrics(): Promise<DashboardTopMetrics> {
    const queries = {
      // Top caficultores por área de café
      topGrowersByArea: `
        SELECT 
          cg.id,
          CONCAT(cg.first_name, ' ', cg.last_name) as name,
          SUM(f.coffee_area) as total_coffee_area
        FROM coffee_growers cg
        JOIN farms f ON cg.id = f.coffee_grower_id
        WHERE cg.deleted_at IS NULL AND f.deleted_at IS NULL
        GROUP BY cg.id, cg.first_name, cg.last_name
        ORDER BY total_coffee_area DESC
        LIMIT 5
      `,
      
      // Top planes de suscripción por ingresos
      topPlansByRevenue: `
        SELECT 
          sp.id,
          sp.name,
          COUNT(s.id) as active_subscriptions,
          SUM(s.price) as total_revenue
        FROM subscription_plans sp
        JOIN subscriptions s ON sp.id = s.plan_id
        WHERE s.status = 'active' AND sp.deleted_at IS NULL
        GROUP BY sp.id, sp.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `,
      
      // Departamentos con más caficultores
      topDepartments: `
        SELECT 
          department,
          COUNT(*) as grower_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
        FROM coffee_growers
        WHERE deleted_at IS NULL
        GROUP BY department
        ORDER BY grower_count DESC
        LIMIT 5
      `,
      
      // Usuarios más activos (por actividad en auditoría)
      mostActiveUsers: `
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          u.email,
          u.role,
          COUNT(al.id) as activity_count
        FROM users u
        JOIN audit_logs al ON u.id = al.user_id
        WHERE u.deleted_at IS NULL
        AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
        ORDER BY activity_count DESC
        LIMIT 5
      `
    };

    const [
      topGrowersByAreaResult,
      topPlansByRevenueResult,
      topDepartmentsResult,
      mostActiveUsersResult
    ] = await Promise.all([
      executeQuery(queries.topGrowersByArea),
      executeQuery(queries.topPlansByRevenue),
      executeQuery(queries.topDepartments),
      executeQuery(queries.mostActiveUsers)
    ]);

    return {
      top_growers_by_area: topGrowersByAreaResult.map((item: any) => ({
        id: item.id,
        name: item.name,
        total_coffee_area: parseFloat(item.total_coffee_area)
      })),
      top_plans_by_revenue: topPlansByRevenueResult.map((item: any) => ({
        id: item.id,
        name: item.name,
        active_subscriptions: item.active_subscriptions,
        total_revenue: parseFloat(item.total_revenue)
      })),
      top_departments: topDepartmentsResult.map((item: any) => ({
        department: item.department,
        grower_count: item.grower_count,
        active_count: item.active_count
      })),
      most_active_users: mostActiveUsersResult.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        activity_count: item.activity_count
      }))
    };
  }
}