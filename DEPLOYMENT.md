# Heroku Deployment Guide

This guide explains how to deploy the NewGirl Backend to Heroku.

## Prerequisites

1. **Heroku CLI**: Install from https://devcenter.heroku.com/articles/heroku-cli
2. **Git**: Ensure your project is in a Git repository
3. **Heroku Account**: Sign up at https://heroku.com

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create Heroku App
```bash
heroku create your-app-name
```

### 3. Set Environment Variables
```bash
# Required variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret-here
heroku config:set MONGODB_URI=your-mongodb-connection-string

# Stripe configuration
heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional: Email configuration
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password

# Optional: Confirmo crypto payments
heroku config:set CONFIRMO_API_KEY=your-confirmo-api-key
heroku config:set CONFIRMO_CALLBACK_PASSWORD=your-callback-password
```

### 4. Deploy to Heroku
```bash
git add .
git commit -m "Add Heroku deployment configuration"
git push heroku main
```

### 5. Scale the Application
```bash
heroku ps:scale web=1
```

### 6. View Logs
```bash
heroku logs --tail
```

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Create account at https://www.mongodb.com/atlas
2. Create a cluster
3. Get connection string
4. Set as MONGODB_URI environment variable

### Option 2: Heroku MongoDB Add-on
```bash
heroku addons:create mongolab:sandbox
```

## Stripe Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app-name.herokuapp.com/payments/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret and set as `STRIPE_WEBHOOK_SECRET`

## Health Check

Your app includes a health check endpoint at `/health` that Heroku can use to monitor your application.

## Troubleshooting

### Check Application Status
```bash
heroku ps
```

### View Configuration
```bash
heroku config
```

### Restart Application
```bash
heroku restart
```

### Access Heroku Bash
```bash
heroku run bash
```

## Production Considerations

1. **Database**: Use MongoDB Atlas or another production-ready database
2. **Logging**: Consider adding structured logging with services like Papertrail
3. **Monitoring**: Set up application monitoring with New Relic or similar
4. **SSL**: Heroku provides SSL certificates automatically
5. **Domain**: Configure custom domain if needed

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to "production" |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `STRIPE_SECRET_KEY` | Yes | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `EMAIL_HOST` | No | SMTP server host |
| `EMAIL_PORT` | No | SMTP server port (default: 587) |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |
| `CONFIRMO_API_KEY` | No | Confirmo crypto payment API key |
| `CONFIRMO_CALLBACK_PASSWORD` | No | Confirmo webhook password |

## API Documentation

Once deployed, your API documentation will be available at:
`https://your-app-name.herokuapp.com/api`
