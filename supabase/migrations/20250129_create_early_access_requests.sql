-- Create early access requests table
CREATE TABLE IF NOT EXISTS early_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    company VARCHAR(255) NOT NULL,
    message TEXT,
    language VARCHAR(2) NOT NULL DEFAULT 'he',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_early_access_requests_email ON early_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_early_access_requests_status ON early_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_early_access_requests_language ON early_access_requests(language);
CREATE INDEX IF NOT EXISTS idx_early_access_requests_submitted_at ON early_access_requests(submitted_at);

-- Create RLS policies
ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new requests (anyone can submit)
CREATE POLICY "Anyone can submit early access requests" ON early_access_requests
    FOR INSERT WITH CHECK (true);

-- Policy for viewing requests (only authenticated users with admin role)
CREATE POLICY "Admin users can view early access requests" ON early_access_requests
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy for updating requests (only admin users)
CREATE POLICY "Admin users can update early access requests" ON early_access_requests
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_early_access_requests_updated_at
    BEFORE UPDATE ON early_access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE early_access_requests
    ADD CONSTRAINT check_status CHECK (status IN ('pending', 'contacted', 'converted', 'rejected'));

ALTER TABLE early_access_requests
    ADD CONSTRAINT check_language CHECK (language IN ('he', 'en'));

ALTER TABLE early_access_requests
    ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add comments
COMMENT ON TABLE early_access_requests IS 'Stores early access requests from the Hebrew landing page';
COMMENT ON COLUMN early_access_requests.full_name IS 'Full name of the person requesting early access';
COMMENT ON COLUMN early_access_requests.email IS 'Email address (unique)';
COMMENT ON COLUMN early_access_requests.company IS 'Company name';
COMMENT ON COLUMN early_access_requests.message IS 'Optional message from the user';
COMMENT ON COLUMN early_access_requests.language IS 'Language of the request (he or en)';
COMMENT ON COLUMN early_access_requests.status IS 'Status of the request (pending, contacted, converted, rejected)';
COMMENT ON COLUMN early_access_requests.ip_address IS 'IP address of the request';
COMMENT ON COLUMN early_access_requests.user_agent IS 'User agent string from the browser'; 