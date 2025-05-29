# Anthropic API Setup Guide

## Getting Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create Key"**
5. Copy the key (it starts with `sk-ant-api03-...`)

## Setting Up Your API Key

### For Local Development

Update your `.env` file:
```env
ANTHROPIC_API_KEY="sk-ant-api03-YOUR-ACTUAL-KEY-HERE"
```

Make sure:
- The key is wrapped in quotes
- The key is complete (not truncated)
- The key starts with `sk-ant-api03-`

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-YOUR-ACTUAL-KEY-HERE`
   - Environment: All (Production, Preview, Development)

## Testing Your Setup

After setting the API key:

1. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. Test rubric generation:
   - Go to http://localhost:3000
   - Submit a prompt
   - Check if you get AI-generated rubrics (20-40 items)

## Fallback Behavior

If the API key is missing or invalid, the app will:
- Use mock rubrics (10 generic items)
- Display a message about using mock data
- Still function normally (won't crash)

## Troubleshooting

### "Failed to generate rubric" Error
1. Check if your API key is valid
2. Verify you have API credits in your Anthropic account
3. Check the browser console for specific error messages

### Mock Rubrics Being Used
If you see only 10 generic rubric items:
- Your API key is not configured correctly
- Check the server logs for "Using mock rubric" messages

### API Rate Limits
Anthropic has rate limits. If you hit them:
- The app will fall back to mock rubrics
- Wait a few minutes before trying again

## Cost Considerations

- Each rubric generation uses ~1,000-2,000 tokens
- Claude 3.5 Sonnet pricing: ~$3 per million input tokens
- Estimated cost: ~$0.003-0.006 per rubric

## Security Notes

- Never commit your API key to git
- Use environment variables only
- Rotate keys regularly
- Monitor usage in Anthropic console 