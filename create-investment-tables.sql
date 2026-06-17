-- Investment Profiles Table
CREATE TABLE IF NOT EXISTS investment_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    age INTEGER,
    income DECIMAL(15,2),
    investment_experience VARCHAR(50),
    risk_tolerance VARCHAR(50),
    investment_goals JSONB,
    time_horizon VARCHAR(50),
    current_investments DECIMAL(15,2),
    monthly_investment_budget DECIMAL(10,2),
    emergency_fund_months INTEGER,
    debt_amount DECIMAL(15,2),
    preferred_investment_types JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Investment Analyses Table
CREATE TABLE IF NOT EXISTS investment_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    analysis_type VARCHAR(100),
    recommendations JSONB,
    risk_assessment JSONB,
    portfolio_allocation JSONB,
    market_opportunities JSONB,
    rebalancing_suggestions JSONB,
    analysis_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Holdings Table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(200),
    shares DECIMAL(15,4),
    purchase_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    purchase_date DATE,
    holding_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_profiles_user_id ON investment_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_analyses_user_id ON investment_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
