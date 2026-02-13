# X/Twitter API Setup Required

## Issue
X API credentials not configured. Social posting returning 401 errors.

## Required Environment Variables
```bash
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret  
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
```

## How to Get Credentials
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing
3. Generate API keys and access tokens
4. Ensure tokens have write permissions for posting

## Current Workaround
Content engine queues tweets for manual approval.
Once credentials are set, run:
```bash
cd /workspace/kira/skills/kira_content
node scripts/content.js pending
node scripts/content.js post <content-id>
```

## Impact
- ✅ Content generation: Working
- ✅ Queue management: Working  
- ❌ Auto-posting to X: Blocked (401 auth error)

## Next Steps
1. Obtain X API credentials
2. Add to environment or .env file
3. Test posting
4. Enable auto-posting for approved content
