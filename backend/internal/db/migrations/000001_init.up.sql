CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    CONSTRAINT sites_domain_unique UNIQUE (domain),
    CONSTRAINT sites_token_unique UNIQUE (token)
);

CREATE TABLE pageviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    referrer_domain TEXT,
    country CHAR(2),
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(50),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    hour_bucket TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pageviews_site_hour ON pageviews (site_id, hour_bucket);
CREATE INDEX idx_pageviews_site_path ON pageviews (site_id, path);
