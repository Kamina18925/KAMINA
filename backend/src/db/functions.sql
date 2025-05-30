-- Funciones SQL para la aplicación Barbería RD

-- Función para validar una sesión de usuario
CREATE OR REPLACE FUNCTION validate_session(session_token VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    user_id INTEGER,
    user_uuid VARCHAR,
    name VARCHAR,
    email VARCHAR,
    role VARCHAR,
    phone VARCHAR,
    shop_id INTEGER,
    expires_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN s.expires_at > NOW() THEN TRUE 
            ELSE FALSE 
        END as is_valid,
        u.id as user_id,
        u.uuid as user_uuid,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.shop_id,
        s.expires_at
    FROM 
        sessions s
    JOIN 
        users u ON s.user_id = u.id
    WHERE 
        s.token = session_token
    LIMIT 1;

    -- Si no se encontró ninguna sesión, devolver una fila con is_valid = FALSE
    IF NOT FOUND THEN
        is_valid := FALSE;
        RETURN NEXT;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para crear una nueva sesión (utilizada durante el login)
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id INTEGER,
    p_token VARCHAR,
    p_expires_in VARCHAR DEFAULT '24 hours'
)
RETURNS TABLE (
    session_id INTEGER,
    token VARCHAR,
    expires_at TIMESTAMP
) AS $$
DECLARE
    new_session_id INTEGER;
    new_expires_at TIMESTAMP;
BEGIN
    -- Calcular la fecha de expiración
    new_expires_at := NOW() + p_expires_in::INTERVAL;
    
    -- Eliminar sesiones existentes para este usuario (opcional)
    DELETE FROM sessions WHERE user_id = p_user_id;
    
    -- Insertar la nueva sesión
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (p_user_id, p_token, new_expires_at)
    RETURNING id, token, expires_at INTO new_session_id, token, expires_at;
    
    -- Devolver los datos de la sesión
    RETURN QUERY
    SELECT new_session_id, token, expires_at;
END;
$$ LANGUAGE plpgsql;
