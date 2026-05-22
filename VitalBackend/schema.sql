-- ============================================
-- VitalApp — Esquema de Base de Datos
-- ============================================

CREATE DATABASE IF NOT EXISTS vitalapp;
USE vitalapp;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario        INT AUTO_INCREMENT PRIMARY KEY,
    nombre            VARCHAR(150) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    fecha_nacimiento  DATE NOT NULL,
    edad              INT AS (TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())) VIRTUAL,
    peso              DECIMAL(5,2) DEFAULT NULL,
    altura            DECIMAL(5,2) DEFAULT NULL,
    genero            VARCHAR(20)  DEFAULT NULL,
    telefono          VARCHAR(20)  DEFAULT NULL,
    rol               ENUM('usuario','admin') DEFAULT 'usuario',
    cuenta_activa     BOOLEAN DEFAULT TRUE,
    fecha_registro    DATETIME DEFAULT CURRENT_TIMESTAMP,
    nivel_actividad   VARCHAR(50)  DEFAULT 'sedentario',
    condiciones_medicas TEXT DEFAULT NULL,
    restricciones     TEXT DEFAULT NULL,
    mfa_secret        VARCHAR(255) DEFAULT NULL,
    mfa_enabled       BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: videos (ejercicios)
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
    id_video                INT AUTO_INCREMENT PRIMARY KEY,
    nombre_video            VARCHAR(255) NOT NULL,
    descripcion             TEXT DEFAULT NULL,
    categoria               VARCHAR(100) NOT NULL,
    subcategoria            VARCHAR(100) DEFAULT NULL,
    dificultad              VARCHAR(50)  NOT NULL,
    duracion_min            INT NOT NULL,
    link_video              VARCHAR(500) NOT NULL,
    url_miniatura           VARCHAR(500) DEFAULT NULL,
    calorias_estimadas      INT DEFAULT NULL,
    edad_minima             INT DEFAULT 60,
    edad_maxima             INT DEFAULT 100,
    peso_maximo_recomendado DECIMAL(5,2) DEFAULT NULL,
    fecha_creacion          DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo                  BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: ejercicio_realizado
-- ============================================
CREATE TABLE IF NOT EXISTS ejercicio_realizado (
    id_ejercicio        INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario          INT NOT NULL,
    id_video            INT NOT NULL,
    fecha_hora_inicio   DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_fin      DATETIME DEFAULT NULL,
    duracion_segundos   INT DEFAULT NULL,
    calorias_quemadas   DECIMAL(7,2) DEFAULT NULL,
    nivel_esfuerzo      VARCHAR(50) DEFAULT NULL,
    completado          BOOLEAN DEFAULT TRUE,
    comentarios         TEXT DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_video)   REFERENCES videos(id_video)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: evolucion_usuario
-- ============================================
CREATE TABLE IF NOT EXISTS evolucion_usuario (
    id_evolucion                INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario                  INT NOT NULL,
    fecha_registro              DATE NOT NULL,
    peso                        DECIMAL(5,2) DEFAULT NULL,
    presion_arterial_sistolica  INT DEFAULT NULL,
    presion_arterial_diastolica INT DEFAULT NULL,
    frecuencia_cardiaca_reposo  INT DEFAULT NULL,
    flexibilidad_cm             DECIMAL(5,2) DEFAULT NULL,
    fuerza_prensalon_kg         DECIMAL(5,2) DEFAULT NULL,
    equilibrio_segundos         INT DEFAULT NULL,
    notas                       TEXT DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: reporte_semanal
-- ============================================
CREATE TABLE IF NOT EXISTS reporte_semanal (
    id_reporte            INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario            INT NOT NULL,
    fecha_inicio_semana   DATE NOT NULL,
    fecha_fin_semana      DATE NOT NULL,
    total_ejercicios      INT DEFAULT 0,
    total_minutos         INT DEFAULT 0,
    total_calorias        DECIMAL(7,2) DEFAULT 0,
    dias_activos          INT DEFAULT 0,
    promedio_esfuerzo     VARCHAR(50) DEFAULT NULL,
    progreso_fisico       TEXT DEFAULT NULL,
    observaciones         TEXT DEFAULT NULL,
    fecha_generacion      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: configuracion_ejercicios
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_ejercicios (
    id_config               INT AUTO_INCREMENT PRIMARY KEY,
    edad_min                INT NOT NULL,
    edad_max                INT NOT NULL,
    peso_min                DECIMAL(5,2) DEFAULT NULL,
    peso_max                DECIMAL(5,2) DEFAULT NULL,
    nivel_dificultad        VARCHAR(50) DEFAULT NULL,
    condiciones_especiales  TEXT DEFAULT NULL,
    categoria_recomendada   VARCHAR(100) DEFAULT NULL,
    max_minutos_diarios     INT DEFAULT 30,
    dias_semana_recomendados INT DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_eliminar_video(IN p_id INT)
BEGIN
    DELETE FROM videos WHERE id_video = p_id;
    SELECT ROW_COUNT() AS filas_afectadas;
END //

CREATE PROCEDURE IF NOT EXISTS sp_eliminar_config(IN p_id INT)
BEGIN
    DELETE FROM configuracion_ejercicios WHERE id_config = p_id;
    SELECT ROW_COUNT() AS filas_afectadas;
END //

CREATE PROCEDURE IF NOT EXISTS sp_eliminar_usuario(IN p_id INT)
BEGIN
    DELETE FROM usuarios WHERE id_usuario = p_id;
    SELECT ROW_COUNT() AS filas_afectadas;
END //

DELIMITER ;
