-- FlowFi Database Initialization Script
-- This script creates the necessary tables and initial data for FlowFi

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS flowfi;

-- Use the flowfi database
\c flowfi;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone_number VARCHAR(20),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- invoice, receipt, contract, etc.
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    extracted_text TEXT,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_fields table for extracted data
CREATE TABLE IF NOT EXISTS document_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL, -- amount, date, vendor, etc.
    field_value TEXT,
    field_type VARCHAR(50), -- text, number, date, currency
    confidence_score DECIMAL(5,4),
    bounding_box JSONB, -- coordinates for the field in the document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create document_categories table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    confidence_score DECIMAL(5,4),
    assigned_by VARCHAR(50) DEFAULT 'ai', -- ai, user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, category_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- expense_summary, category_breakdown, etc.
    date_range_start DATE,
    date_range_end DATE,
    filters JSONB, -- store filter criteria
    s3_key VARCHAR(500), -- location of generated report file
    s3_bucket VARCHAR(255),
    status VARCHAR(50) DEFAULT 'generating', -- generating, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- document_processed, report_ready, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    notification_data JSONB, -- additional data for the notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, upload_document, generate_report, etc.
    resource_type VARCHAR(100), -- document, report, user, etc.
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_document_fields_document_id ON document_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_document_fields_field_name ON document_fields(field_name);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_document_id ON document_categories(document_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_category_id ON document_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default categories
INSERT INTO categories (id, user_id, name, description, color, is_default) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Office Supplies', 'Office equipment and supplies', '#3B82F6', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Travel & Transportation', 'Business travel and transportation expenses', '#10B981', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Meals & Entertainment', 'Business meals and entertainment', '#F59E0B', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Professional Services', 'Legal, accounting, and consulting services', '#8B5CF6', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Marketing & Advertising', 'Marketing and advertising expenses', '#EF4444', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Utilities', 'Electricity, water, internet, and other utilities', '#6B7280', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Software & Subscriptions', 'Software licenses and subscription services', '#06B6D4', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Equipment & Hardware', 'Computer equipment and hardware', '#84CC16', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Insurance', 'Business insurance premiums', '#F97316', true),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Miscellaneous', 'Other business expenses', '#64748B', true)
ON CONFLICT (user_id, name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your specific setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowfi_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowfi_admin;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO flowfi_admin;

COMMIT;