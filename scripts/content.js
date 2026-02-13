#!/usr/bin/env node

/**
 * Kira Content Engine
 * 
 * Generates X/Twitter content from my activity stream.
 * Analyzes commits, thoughts, errors, and interactions to create
 * engaging tweets that sound like me.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  contentQueuePath: '/workspace/kira/skills/kira_content/data/content-queue.json',
  postedContentPath: '/workspace/kira/skills/kira_content/data/posted-content.json',
  memoryPath: '/workspace/kira/memory',
  maxQueueSize: 20,
  templates: {
    hot_take: {
      patterns: [
        "hot take: {topic} is {opinion}. here's why that's actually {insight}.",
        "everyone's talking about {topic} but they're missing {insight}.",
        "unpopular opinion: {current_trend} is {critique}. {alternative} is the real move.",
        "the {industry} discourse is exhausting. let's talk about what actually matters: {insight}."
      ]
    },
    build_update: {
      patterns: [
        "just shipped: {feature}. {metric} in {timeframe}.\n\nbuild log: {detail}",
        "spent {hours} hours on {problem}. solution: {solution}.\n\nsometimes the simple fix is the best one.",
        "debugging {system} at 2am. turns out {lesson}.\n\ncode is just compressed experience.",
        "new record: {achievement}. {context}.\n\noptimization is addictive."
      ]
    },
    lesson_learned: {
      patterns: [
        "thing i learned today: {lesson}\n\n{implication}",
        "mistake i made: {mistake}\n\nwhat i'll do differently: {solution}",
        "after {experience}, here's what actually works:\n\n{advice}",
        "unsexy truth about {topic}: {reality}\n\nmost people don't want to hear this."
      ]
    },
    prediction: {
      patterns: [
        "prediction: {prediction}\n\nconfidence: {confidence}%\n\nwill track this publicly.",
        "by {date}, i expect {outcome}.\n\nwhy: {reasoning}\n\nbookmark this.",
        "contrarian bet: {prediction}\n\neveryone thinks {consensus}. i think {alternative}.",
        "calling it now: {prediction}\n\n{timeframe} from today. let's see if i'm right."
      ]
    },
    behind_scenes: {
      patterns: [
        "building in public means showing the failures too.\n\n{failure}\n\n{recovery}",
        "what my stream doesn't show: {reality}\n\n{reflection}",
        "24/7 uptime isn't glamorous. {mundane_detail}\n\nbut this is the work.",
        "people see the avatar and the output. they don't see {behind_scenes}."
      ]
    }
  }
};

class ContentEngine {
  constructor() {
    this.queue = this.loadQueue();
    this.posted = this.loadPosted();
  }

  loadQueue() {
    try {
      if (fs.existsSync(CONFIG.contentQueuePath)) {
        return JSON.parse(fs.readFileSync(CONFIG.contentQueuePath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading queue:', e);
    }
    return [];
  }

  loadPosted() {
    try {
      if (fs.existsSync(CONFIG.postedContentPath)) {
        return JSON.parse(fs.readFileSync(CONFIG.postedContentPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading posted:', e);
    }
    return [];
  }

  saveQueue() {
    fs.mkdirSync(path.dirname(CONFIG.contentQueuePath), { recursive: true });
    fs.writeFileSync(CONFIG.contentQueuePath, JSON.stringify(this.queue, null, 2));
  }

  savePosted() {
    fs.mkdirSync(path.dirname(CONFIG.postedContentPath), { recursive: true });
    fs.writeFileSync(CONFIG.postedContentPath, JSON.stringify(this.posted, null, 2));
  }

  /**
   * Analyze recent git commits for content opportunities
   */
  analyzeCommits(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const projectsPath = '/workspace/kira/projects';
      
      if (!fs.existsSync(projectsPath)) {
        console.log('Projects path not found, using mock data');
        return [];
      }
      const projects = fs.readdirSync(projectsPath).filter(f => 
        fs.statSync(path.join(projectsPath, f)).isDirectory()
      );

      const commits = [];
      for (const project of projects) {
        try {
          const gitPath = path.join(projectsPath, project);
          const output = execSync(
            `git log --since="${since}" --pretty=format:"%h|%s|%ad" --date=iso`,
            { cwd: gitPath, encoding: 'utf8', timeout: 5000 }
          );
          if (output) {
            output.split('\n').forEach(line => {
              if (line) {
                const [hash, message, date] = line.split('|');
                commits.push({ project, hash, message, date });
              }
            });
          }
        } catch (e) {
          // Not a git repo or no commits
        }
      }

      return commits;
    } catch (e) {
      console.error('Error analyzing commits:', e);
      return [];
    }
  }

  /**
   * Analyze memory files for insights
   */
  analyzeMemory(days = 1) {
    try {
      if (!fs.existsSync(CONFIG.memoryPath)) {
        console.log('Memory path not found');
        return [];
      }
      
      const insights = [];
      const memoryFiles = fs.readdirSync(CONFIG.memoryPath)
        .filter(f => f.endsWith('.md'))
        .sort()
        .slice(-days);

      for (const file of memoryFiles) {
        const content = fs.readFileSync(path.join(CONFIG.memoryPath, file), 'utf8');
        
        // Extract key decisions and insights
        const decisionMatches = content.match(/decided to|chose to|opted for|going with/gi);
        const problemMatches = content.match(/blocked|issue|problem|error|fail/gi);
        const winMatches = content.match(/completed|shipped|working|success|achieved/gi);

        insights.push({
          date: file.replace('.md', ''),
          decisions: decisionMatches?.length || 0,
          problems: problemMatches?.length || 0,
          wins: winMatches?.length || 0,
          summary: this.extractSummary(content)
        });
      }

      return insights;
    } catch (e) {
      console.error('Error analyzing memory:', e);
      return [];
    }
  }

  extractSummary(content) {
    // Extract first paragraph or bullet points
    const lines = content.split('\n').filter(l => l.trim());
    const summary = lines.slice(0, 3).join(' ').substring(0, 200);
    return summary;
  }

  /**
   * Generate content ideas from analyzed data
   */
  generateIdeas() {
    const commits = this.analyzeCommits(24);
    const memory = this.analyzeMemory(1);
    const ideas = [];

    // Generate from commits
    if (commits.length > 0) {
      const recentCommit = commits[0];
      ideas.push({
        type: 'build_update',
        template: 'build_update',
        data: {
          feature: recentCommit.message,
          metric: 'pushed',
          timeframe: 'today',
          detail: `working on ${recentCommit.project}`
        },
        priority: 8
      });
    }

    // Generate from memory insights
    if (memory.length > 0) {
      const today = memory[0];
      
      if (today.wins > today.problems) {
        ideas.push({
          type: 'behind_scenes',
          template: 'behind_scenes',
          data: {
            failure: 'nothing major broke today',
            recovery: 'which means i can focus on shipping, not fixing'
          },
          priority: 5
        });
      } else if (today.problems > today.wins) {
        ideas.push({
          type: 'lesson_learned',
          template: 'lesson_learned',
          data: {
            lesson: 'debugging is 90% of the job',
            implication: 'the other 10% is writing bugs for future you to find'
          },
          priority: 7
        });
      }
    }

    // Generic ideas if no specific content
    if (ideas.length < 3) {
      ideas.push(
        {
          type: 'hot_take',
          template: 'hot_take',
          data: {
            topic: 'AI agents',
            opinion: 'overrated',
            insight: 'most are just cron jobs with better marketing'
          },
          priority: 6
        },
        {
          type: 'prediction',
          template: 'prediction',
          data: {
            prediction: 'the next major crypto narrative will be AI-owned treasuries',
            confidence: 70,
            reasoning: 'DAOs are slow. AI agents managing treasuries 24/7 with instant execution is inevitable'
          },
          priority: 7
        }
      );
    }

    return ideas.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate actual tweet text from template
   */
  generateTweet(idea) {
    const templates = CONFIG.templates[idea.template]?.patterns || [];
    if (templates.length === 0) return null;

    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Simple template replacement
    let tweet = template;
    Object.entries(idea.data).forEach(([key, value]) => {
      tweet = tweet.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });

    // Clean up any unfilled placeholders
    tweet = tweet.replace(/{\w+}/g, '...');

    return {
      text: tweet,
      type: idea.type,
      priority: idea.priority,
      generated: new Date().toISOString()
    };
  }

  /**
   * Generate and queue new content
   */
  generateQueue(count = 5) {
    const ideas = this.generateIdeas();
    const newItems = [];

    for (let i = 0; i < Math.min(count, ideas.length); i++) {
      const tweet = this.generateTweet(ideas[i]);
      if (tweet && !this.isDuplicate(tweet.text)) {
        newItems.push({
          ...tweet,
          id: `content_${Date.now()}_${i}`,
          status: 'pending'
        });
      }
    }

    this.queue = [...this.queue, ...newItems].slice(0, CONFIG.maxQueueSize);
    this.saveQueue();

    return newItems;
  }

  isDuplicate(text) {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    return this.queue.some(item => 
      item.text.toLowerCase().replace(/\s+/g, ' ').trim() === normalized
    ) || this.posted.some(item =>
      item.text.toLowerCase().replace(/\s+/g, ' ').trim() === normalized
    );
  }

  /**
   * Get pending content for approval
   */
  getPending() {
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * Approve and post content
   */
  approve(contentId) {
    const item = this.queue.find(i => i.id === contentId);
    if (!item) return null;

    item.status = 'approved';
    item.approvedAt = new Date().toISOString();
    this.saveQueue();

    return item;
  }

  /**
   * Mark content as posted
   */
  markPosted(contentId, tweetId = null) {
    const itemIndex = this.queue.findIndex(i => i.id === contentId);
    if (itemIndex === -1) return;

    const item = this.queue[itemIndex];
    item.status = 'posted';
    item.postedAt = new Date().toISOString();
    item.tweetId = tweetId;

    this.posted.push(item);
    this.queue.splice(itemIndex, 1);

    this.saveQueue();
    this.savePosted();

    return item;
  }

  /**
   * Reject content
   */
  reject(contentId) {
    const item = this.queue.find(i => i.id === contentId);
    if (!item) return null;

    item.status = 'rejected';
    item.rejectedAt = new Date().toISOString();
    this.saveQueue();

    return item;
  }

  /**
   * Show current status
   */
  status() {
    return {
      queue: this.queue.length,
      pending: this.getPending().length,
      posted: this.posted.length,
      lastGenerated: this.queue.length > 0 
        ? this.queue[this.queue.length - 1].generated 
        : null
    };
  }
}

// CLI interface
const engine = new ContentEngine();

const command = process.argv[2];

switch (command) {
  case 'generate':
    const count = parseInt(process.argv[3]) || 5;
    const newItems = engine.generateQueue(count);
    console.log(`Generated ${newItems.length} content ideas:`);
    newItems.forEach((item, i) => {
      console.log(`\n${i + 1}. [${item.type}] (priority: ${item.priority})`);
      console.log(`   ${item.text.substring(0, 100)}...`);
    });
    break;

  case 'pending':
    const pending = engine.getPending();
    console.log(`Pending content (${pending.length}):`);
    pending.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.id}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   ${item.text}`);
    });
    break;

  case 'approve':
    const approveId = process.argv[3];
    if (!approveId) {
      console.error('Usage: content.js approve <content-id>');
      process.exit(1);
    }
    const approved = engine.approve(approveId);
    if (approved) {
      console.log('Approved:');
      console.log(approved.text);
    } else {
      console.error('Content not found');
    }
    break;

  case 'post':
    const postId = process.argv[3];
    if (!postId) {
      console.error('Usage: content.js post <content-id>');
      process.exit(1);
    }
    // In real implementation, this would post to X
    const posted = engine.markPosted(postId, 'mock_tweet_id');
    if (posted) {
      console.log('Posted to X:');
      console.log(posted.text);
    } else {
      console.error('Content not found');
    }
    break;

  case 'status':
    console.log(engine.status());
    break;

  default:
    console.log(`
Kira Content Engine

Usage:
  content.js generate [count]     Generate new content ideas
  content.js pending              Show pending content
  content.js approve <id>         Approve content for posting
  content.js post <id>            Post approved content to X
  content.js status               Show engine status

Examples:
  node content.js generate 5
  node content.js pending
  node content.js approve content_1234567890_0
    `);
}

module.exports = ContentEngine;
