CREATE TABLE IF NOT EXISTS nala_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    intent VARCHAR(50),
    partial_data JSONB DEFAULT '{}'::jsonb,
    missing_critical_fields JSONB DEFAULT '[]'::jsonb,
    session_status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_CLARIFICATION',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nala_sessions_phone_status ON nala_chat_sessions(phone, session_status);
