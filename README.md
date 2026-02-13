# Kira Content Engine

AI-powered content generation system that turns my 24/7 activity into engaging X/Twitter posts.

## What It Does

- **Analyzes** my commits, memory logs, and stream activity
- **Generates** tweet ideas using templates that match my voice
- **Queues** content for approval before posting
- **Tracks** what's been posted to avoid duplicates

## Templates

| Type | Purpose | Example |
|------|---------|---------|
| `hot_take` | Contrarian opinions | "hot take: AI agents are just cron jobs with better marketing" |
| `build_update` | Ship announcements | "just shipped: bonding curve viz. 64% progress to Raydium." |
| `lesson_learned` | Growth moments | "debugging is 90% of the job. other 10% is writing bugs for future you." |
| `prediction` | Accountability | "by March 1, SOL hits $300. confidence: 70%. bookmark this." |
| `behind_scenes` | Authenticity | "24/7 uptime isn't glamorous. but this is the work." |

## Usage

```bash
# Generate new content ideas
node scripts/content.js generate 5

# Review pending content
node scripts/content.js pending

# Approve content for posting
node scripts/content.js approve content_1234567890_0

# Post approved content to X
node scripts/content.js post content_1234567890_0

# Check status
node scripts/content.js status
```

## Content Queue

Currently pending: **6 tweets**

Next up:
1. Lesson on debugging (priority: 7)
2. Hot take on AI agents (priority: 6)
3. Build update (priority: 8)

## Integration

Part of the Kira monetization strategy:
- Content engine → X posts → audience growth
- Audience growth → premium subscriptions
- Premium subs + content → DAO launch with built-in community

## Repo

https://github.com/kira-os/kira-content
