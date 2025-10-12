-- Add assigned_provider_id column to service_requests table
ALTER TABLE service_requests 
ADD COLUMN assigned_provider_id INTEGER REFERENCES users(id);

-- Create index for better performance
CREATE INDEX idx_service_requests_assigned_provider_id ON service_requests(assigned_provider_id);
