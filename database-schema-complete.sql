-- Esquema completo de base de datos Cafe Colombia App
-- Basado en la estructura de producción actualizada

-- Tabla de administradores (admin_users)
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_super_admin` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_admin_status` (`is_active`),
  KEY `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de caficultores (coffee_growers)
CREATE TABLE IF NOT EXISTS `coffee_growers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identification_number` varchar(50) NOT NULL,
  `identification_type` enum('cedula','cedula_extranjeria','pasaporte','nit') NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('masculino','femenino','otro','prefiero_no_decir') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `department` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL,
  `rural_zone` varchar(100) DEFAULT NULL,
  `farm_experience_years` int(11) DEFAULT NULL,
  `coffee_experience_years` int(11) DEFAULT NULL,
  `certification_type` enum('organico','rainforest','utz','fairtrade','cafe_especial','ninguna') DEFAULT NULL,
  `certification_number` varchar(100) DEFAULT NULL,
  `certification_expiry` date DEFAULT NULL,
  `total_farm_area` decimal(10,2) DEFAULT NULL,
  `coffee_area` decimal(10,2) DEFAULT NULL,
  `altitude` int(11) DEFAULT NULL,
  `average_temperature` decimal(5,2) DEFAULT NULL,
  `annual_rainfall` int(11) DEFAULT NULL,
  `soil_type` varchar(100) DEFAULT NULL,
  `coffee_varieties` text DEFAULT NULL,
  `processing_methods` text DEFAULT NULL,
  `fertilization_program` text DEFAULT NULL,
  `pruning_schedule` text DEFAULT NULL,
  `quality_score` int(11) DEFAULT NULL,
  `preferred_varieties` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identification_number` (`identification_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_coffee_growers_status` (`status`),
  KEY `idx_coffee_growers_department` (`department`),
  KEY `idx_coffee_growers_municipality` (`municipality`),
  KEY `idx_coffee_growers_certification` (`certification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de fincas (farms)
CREATE TABLE IF NOT EXISTS `farms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coffee_grower_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` text DEFAULT NULL,
  `size_hectares` decimal(10,2) DEFAULT NULL,
  `altitude_meters` int(11) DEFAULT NULL,
  `coffee_varieties` text DEFAULT NULL,
  `processing_methods` text DEFAULT NULL,
  `certification_type` enum('organico','rainforest','utz','fairtrade','cafe_especial','ninguna') DEFAULT NULL,
  `certification_number` varchar(100) DEFAULT NULL,
  `certification_expiry` date DEFAULT NULL,
  `annual_production_kg` int(11) DEFAULT NULL,
  `soil_type` varchar(100) DEFAULT NULL,
  `average_temperature` decimal(5,2) DEFAULT NULL,
  `annual_rainfall_mm` int(11) DEFAULT NULL,
  `fertilization_program` text DEFAULT NULL,
  `pruning_schedule` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive','maintenance','abandoned') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_farms_coffee_grower` (`coffee_grower_id`),
  KEY `idx_farms_status` (`status`),
  KEY `idx_farms_certification` (`certification_type`),
  CONSTRAINT `fk_farms_coffee_grower` FOREIGN KEY (`coffee_grower_id`) REFERENCES `coffee_growers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos (products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT '0',
  `min_stock` int(11) DEFAULT '0',
  `max_stock` int(11) DEFAULT '0',
  `supplier` varchar(255) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive','discontinued') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de órdenes (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `customer_type` enum('coffee_grower','admin','external') NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `final_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','paid','partial','refunded','cancelled') NOT NULL DEFAULT 'pending',
  `order_status` enum('pending','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_orders_customer` (`customer_type`,`customer_id`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_payment` (`payment_status`),
  KEY `idx_orders_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalles de órdenes (order_items)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría (audit_logs)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(100) NOT NULL,
  `record_id` varchar(36) NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `user_type` enum('admin','coffee_grower','system') DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_table` (`table_name`),
  KEY `idx_audit_record` (`record_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS `idx_coffee_growers_created_at` ON `coffee_growers` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_farms_created_at` ON `farms` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_products_created_at` ON `products` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_orders_created_at` ON `orders` (`created_at`);

-- Datos iniciales de administrador
INSERT INTO `admin_users` (`email`, `password_hash`, `name`, `is_super_admin`, `is_active`) VALUES
('admin@cafecolombia.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Principal', 1, 1);

-- Permisos y roles básicos
GRANT SELECT, INSERT, UPDATE, DELETE ON u689528678_CAFECOLOMBIA.* TO 'u689528678_SSALAZARCA'@'%';

-- Triggers para auditoría (ejemplo básico)
DELIMITER //

CREATE TRIGGER IF NOT EXISTS `coffee_growers_audit_insert`
AFTER INSERT ON `coffee_growers`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_logs` (`table_name`, `record_id`, `action`, `new_values`, `user_type`, `created_at`)
  VALUES ('coffee_growers', NEW.id, 'INSERT', JSON_OBJECT(
    'identification_number', NEW.identification_number,
    'full_name', NEW.full_name,
    'email', NEW.email,
    'created_by', NEW.created_by
  ), 'system', NOW());
END//

CREATE TRIGGER IF NOT EXISTS `coffee_growers_audit_update`
AFTER UPDATE ON `coffee_growers`
FOR EACH ROW
BEGIN
  INSERT INTO `audit_logs` (`table_name`, `record_id`, `action`, `old_values`, `new_values`, `user_type`, `created_at`)
  VALUES ('coffee_growers', NEW.id, 'UPDATE', JSON_OBJECT(
    'full_name', OLD.full_name,
    'email', OLD.email,
    'status', OLD.status
  ), JSON_OBJECT(
    'full_name', NEW.full_name,
    'email', NEW.email,
    'status', NEW.status
  ), 'system', NOW());
END//

DELIMITER ;