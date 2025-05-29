# Claude 4 Upgrade Guide

This project has been updated to support Claude 4! 🎉

## What's New

- **Claude 4 Sonnet**: Balanced performance and efficiency (new default)
- **Claude 4 Opus**: Most powerful model for complex tasks  
- **Centralized Configuration**: Easy model switching via environment variables
- **Task-Specific Optimization**: Different models can be used for different tasks

## Quick Setup

1. **Update your `.env.local` file** to include:
   ```env
   DEFAULT_MODEL="claude-4-sonnet"
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

That's it! Your app is now using Claude 4.

## Model Options

### Claude 4 Sonnet (Recommended Default)
- **Model ID**: `claude-sonnet-4-20250514`
- **Best for**: Most applications, balanced performance and cost
- **Use case**: General rubric generation, grading, everyday tasks

### Claude 4 Opus (Most Powerful)
- **Model ID**: `claude-opus-4-20250514`  
- **Best for**: Complex reasoning, detailed analysis
- **Use case**: When you need the highest quality output

### Claude 3.5 Sonnet (Previous Generation)
- **Model ID**: `claude-3-5-sonnet-20241022`
- **Best for**: Cost optimization, faster responses
- **Use case**: When cost or speed is more important than latest capabilities

## Configuration Options

You can configure the model in several ways:

### Option 1: Simple Model Key (Recommended)
```env
DEFAULT_MODEL="claude-4-sonnet"     # Uses latest Claude 4 Sonnet
DEFAULT_MODEL="claude-4-opus"       # Uses latest Claude 4 Opus  
DEFAULT_MODEL="claude-3.5-sonnet"   # Uses Claude 3.5 Sonnet
```

### Option 2: Full Model ID
```env
DEFAULT_MODEL="claude-sonnet-4-20250514"      # Specific Claude 4 Sonnet version
DEFAULT_MODEL="claude-opus-4-20250514"        # Specific Claude 4 Opus version
DEFAULT_MODEL="claude-3-5-sonnet-20241022"    # Specific Claude 3.5 Sonnet version
```

## Environment Variable Reference

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Claude API Configuration  
ANTHROPIC_API_KEY="sk-ant-api03-..."
DEFAULT_MODEL="claude-4-sonnet"  # New: Configure your default model

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/prompt"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/prompt"

# Admin Configuration
ADMIN_EMAILS="admin@example.com"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Task-Specific Configuration

The system uses different configurations for different tasks:

- **Rubric Generation**: Uses higher creativity (temperature: 0.7)
- **Rubric Grading**: Uses lower creativity for consistency (temperature: 0.3)  
- **Prompt Grading**: Uses lower creativity for consistency (temperature: 0.3)

All tasks use the same model specified by `DEFAULT_MODEL` unless customized in the code.

## Cost Considerations

### Claude 4 Pricing (approximate)
- **Sonnet 4**: $3 input / $15 output per 1M tokens
- **Opus 4**: $15 input / $75 output per 1M tokens

### Usage Estimate per Rubric
- **Input**: ~1,000-2,000 tokens (prompts + context)
- **Output**: ~2,000-4,000 tokens (rubric generation)
- **Cost per rubric**: 
  - Sonnet 4: ~$0.03-0.06
  - Opus 4: ~$0.45-0.90

## Advanced Configuration

If you need to customize models for specific tasks, you can modify `src/lib/anthropic-config.ts`:

```typescript
export const TASK_CONFIGS = {
  rubricGeneration: {
    model: 'claude-opus-4-20250514',  // Use Opus for complex rubric generation
    maxTokens: 4000,
    temperature: 0.7,
  },
  rubricGrading: {
    model: 'claude-sonnet-4-20250514',  // Use Sonnet for faster grading
    maxTokens: 2000,
    temperature: 0.3,
  },
  // ...
}
```

## Troubleshooting

### Model Not Found Error
If you get a model not found error:
1. Check that your `ANTHROPIC_API_KEY` is valid
2. Verify you have access to Claude 4 models
3. Try falling back to `claude-3.5-sonnet` temporarily

### Higher Costs Than Expected
- Claude 4 is more expensive than 3.5
- Monitor your usage in the Anthropic console
- Consider using Sonnet 4 instead of Opus 4 for cost optimization

### Slower Response Times
- Claude 4 Opus is slower than Sonnet models
- Consider using Sonnet 4 for better speed/quality balance
- Opus 4 is best reserved for complex tasks requiring deep reasoning

## Migration Notes

This update maintains backward compatibility. If you don't set `DEFAULT_MODEL`, the system defaults to Claude 4 Sonnet for the best balance of performance and cost.

All existing API calls will work without changes - only the underlying model has been upgraded.

## Support

If you encounter any issues:
1. Check the [Anthropic documentation](https://docs.anthropic.com/en/docs/models-overview)
2. Verify your API key has access to Claude 4 models
3. Review the console logs for specific error messages 