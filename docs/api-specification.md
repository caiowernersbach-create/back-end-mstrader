# AMS Trading Journal Web - API Specification

## Overview

This document outlines the RESTful API specification for AMS Trading Journal Web, designed to support the SaaS trading analytics platform with future integration capabilities.

## Base URL
```
https://api.ams-trading-journal.com/v1
```

## Authentication
All API endpoints require authentication using Bearer tokens:
```
Authorization: Bearer <access_token>
```

## Response Format
All responses follow this standard format:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Responses
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Endpoints

### Authentication
```
POST /auth/login
POST /auth/register
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
```

### Users
```
GET /users/profile
PUT /users/profile
GET /users/preferences
PUT /users/preferences
```

### Subscription Plans
```
GET /subscription-plans
GET /subscription-plans/:id
POST /subscription-plans/subscribe
```

### Trades
```
GET /trades
POST /trades
GET /trades/:id
PUT /trades/:id
DELETE /trades/:id
GET /trades/export
POST /trades/import
```

### Strategies
```
GET /strategies
POST /strategies
GET /strategies/:id
PUT /strategies/:id
DELETE /strategies/:id
```

### Analytics
```
GET /analytics/dashboard
GET /analytics/monthly/:year/:month
GET /analytics/calendar
GET /analytics/performance
GET /analytics/consistency
```

### Mentor Relationships
```
GET /mentor/relationships
POST /mentor/relationships
PUT /mentor/relationships/:id
GET /mentor/students
GET /mentor/analytics
```

### Performance Metrics
```
GET /metrics
GET /metrics/:type
POST /metrics/calculate
```

## Data Models

### User
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "trader|mentor|admin",
  "subscription_plan": {
    "id": "uuid",
    "name": "string",
    "price": "decimal",
    "billing_cycle": "monthly|yearly"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "preferences": {}
}
```

### Trade
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "asset": "string",
  "symbol": "string",
  "trade_type": "long|short",
  "entry_price": "decimal",
  "exit_price": "decimal",
  "position_size": "decimal",
  "result_value": "decimal",
  "result_type": "win|loss|breakeven",
  "risk_reward_ratio": "decimal",
  "strategy_id": "uuid",
  "trade_date": "timestamp",
  "source": "manual|metatrader|api|csv",
  "metadata": {},
  "trade_details": {
    "emotional_state": "string",
    "entry_process_quality": "integer",
    "risk_management_respected": "boolean",
    "notes": "text"
  }
}
```

### Strategy
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "description": "text",
  "is_active": "boolean",
  "tags": ["string"],
  "performance_metrics": {},
  "color": "string",
  "icon": "string"
}
```

### Monthly Summary
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "year": "integer",
  "month": "integer",
  "total_trades": "integer",
  "winning_trades": "integer",
  "losing_trades": "integer",
  "breakeven_trades": "integer",
  "win_rate": "decimal",
  "total_profit": "decimal",
  "total_loss": "decimal",
  "net_result": "decimal",
  "profit_factor": "decimal",
  "avg_win": "decimal",
  "avg_loss": "decimal",
  "largest_win": "decimal",
  "largest_loss": "decimal",
  "consistency_score": "decimal"
}
```

## Webhooks

### Trade Imported
```json
{
  "event": "trade.imported",
  "data": {
    "trade_id": "uuid",
    "user_id": "uuid",
    "source": "metatrader",
    "import_count": 1,
    "timestamp": "timestamp"
  }
}
```

### Monthly Summary Calculated
```json
{
  "event": "monthly_summary.calculated",
  "data": {
    "user_id": "uuid",
    "year": 2024,
    "month": 1,
    "summary_id": "uuid",
    "timestamp": "timestamp"
  }
}
```

### Mentor Relationship Updated
```json
{
  "event": "mentor_relationship.updated",
  "data": {
    "relationship_id": "uuid",
    "mentor_id": "uuid",
    "trader_id": "uuid",
    "status": "approved",
    "timestamp": "timestamp"
  }
}
```

## Rate Limiting
- **Authentication endpoints**: 5 requests per minute
- **Read endpoints**: 100 requests per minute
- **Write endpoints**: 20 requests per minute
- **File upload**: 10 requests per minute

## Pagination
All list endpoints support pagination:
```
?page=1&limit=20&sort=trade_date&order=desc
```

## Filtering
Most endpoints support filtering:
```
?asset=EURUSD&trade_type=long&result_type=win&date_from=2024-01-01&date_to=2024-01-31
```

## Search
Search functionality is available on relevant endpoints:
```
?search=EURUSD&search_fields=asset,symbol
```

## Versioning
API versioning is handled through the URL path:
- `/v1/` - Current stable version
- `/v2/` - Future version (when breaking changes are introduced)

## Documentation
Interactive API documentation is available at:
```
https://api.ams-trading-journal.com/docs
```

## Integration Guidelines

### MetaTrader Integration
1. Use the `/trades/import` endpoint with MT4/MT5 data format
2. Implement webhook handling for real-time trade updates
3. Use OAuth 2.0 for secure authentication

### Third-Party Analytics
1. Use the `/analytics` endpoints for performance data
2. Implement proper rate limiting and caching
3. Handle pagination for large datasets

### Mobile App Integration
1. Use WebSocket for real-time updates
2. Implement offline data synchronization
3. Use push notifications for important events