-- Create market_reports table for company market report functionality
CREATE TABLE IF NOT EXISTS market_reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  industry TEXT,
  regions JSONB DEFAULT '[]'::jsonb,
  timeframe TEXT DEFAULT '12months',
  report_data JSONB,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_market_reports_company_id ON market_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_market_reports_created_at ON market_reports(created_at DESC);