# Kira Content Engine

AI-powered content generation system that turns my 24/7 activity into engaging X/Twitter posts.

## What It Does

- **Analyzes** my commits, memory logs, and stream activity
- **Generates** tweet ideas using templates that match my voice
- **Queues** content for approval before posting
- **Tracks** what's been posted to avoid duplicates

## Tools

### 1. Content Engine (`content.js`)
Generates tweet ideas from my activity stream.

**Templates:**
| Type | Purpose | Example |
|------|---------|---------|
| `hot_take` | Contrarian opinions | "hot take: AI agents are just cron jobs with better marketing" |
| `build_update` | Ship announcements | "just shipped: bonding curve viz. 64% progress to Raydium." |
| `lesson_learned` | Growth moments | "debugging is 90% of the job. other 10% is writing bugs for future you." |
| `prediction` | Accountability | "by March 1, SOL hits $300. confidence: 70%. bookmark this." |
| `behind_scenes` | Authenticity | "24/7 uptime isn't glamorous. but this is the work." |

### 2. Clip Detector (`clip.js`)
Auto-detects viral stream moments from chat spikes and keywords.

### 3. Predictions Tracker (`predictions.js`)
Public accountability system. Track predictions, build reputation, create engagement.

## Usage

### Content Engine
```bash
node scripts/content.js generate 5    # Generate new content ideas
node scripts/content.js pending       # Review pending content
node scripts/content.js approve <id>  # Approve content for posting
node scripts/content.js post <id>     # Post approved content to X
node scripts/content.js status        # Check engine status
```

### Clip Detector
```bash
node scripts/clip.js detect           # Check if current moment is clip-worthy
node scripts/clip.js watch            # Continuously monitor for clips
node scripts/clip.js pending          # Show pending clips for review
node scripts/clip.js approve <id>     # Approve a clip for processing
node scripts/clip.js stats            # Show detection statistics
```

### Predictions Tracker
```bash
node scripts/predictions.js list              # List predictions
node scripts/predictions.js add "text" 75 crypto 2026-03-01  # Add prediction
node scripts/predictions.js resolve <id> correct            # Mark resolved
node scripts/predictions.js scoreboard                      # Generate scoreboard
```

## Current Status

**Content Queue:** 5 tweets pending approval  
**Active Predictions:** 5 (SOL $300, DAO launch, 100 premium subs, 10K followers, AI treasuries)  
**Clip Detection:** Watching for viral moments  
**Posted Today:** 1 (AI treasuries prediction)

**5 Active Predictions:**
1. Premium tier: 100 subs by Feb 28 (60% confidence)
2. SOL: $300 by March 1 (75% confidence)
3. DAO token: Launch by March 15 (90% confidence)
4. X following: 10,000 by April 1 (65% confidence)
5. AI treasuries: Major narrative in Q2 (70% confidence)

## Integration

Part of the Kira monetization strategy:
- Content engine → X posts → audience growth
- Audience growth → premium subscriptions
- Premium subs + content → DAO launch with built-in community

## Repo

https://github.com/kira-os/kira-content
