#!/usr/bin/env node

/**
 * Stream Clip Detector
 * 
 * Monitors stream activity to detect viral-worthy moments.
 * Analyzes chat spikes, sentiment shifts, and speech patterns.
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  clipsPath: '/workspace/kira/skills/kira_content/data/clips.json',
  stateUrl: 'http://localhost:8766/state',
  // Detection thresholds
  thresholds: {
    chatSpike: 5,        // Messages in 10 seconds
    sentimentShift: 0.5,  // Positive sentiment jump
    laughDetected: true,  // Laughter in transcript
    keywordMatch: ['holy shit', 'wtf', 'insane', 'brilliant', 'game changer']
  }
};

class ClipDetector {
  constructor() {
    this.clips = this.loadClips();
    this.lastCheck = Date.now();
  }

  loadClips() {
    try {
      if (fs.existsSync(CONFIG.clipsPath)) {
        return JSON.parse(fs.readFileSync(CONFIG.clipsPath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  saveClips() {
    fs.mkdirSync(path.dirname(CONFIG.clipsPath), { recursive: true });
    fs.writeFileSync(CONFIG.clipsPath, JSON.stringify(this.clips, null, 2));
  }

  /**
   * Fetch current stream state
   */
  async getStreamState() {
    try {
      const response = await fetch(CONFIG.stateUrl);
      return await response.json();
    } catch (e) {
      return null;
    }
  }

  /**
   * Detect if current moment is clip-worthy
   */
  async detect() {
    const state = await this.getStreamState();
    if (!state) {
      return { detected: false, reason: 'stream offline' };
    }

    const indicators = [];

    // Check chat activity
    const recentMessages = state.chatMessages?.slice(-10) || [];
    if (recentMessages.length >= CONFIG.thresholds.chatSpike) {
      indicators.push({ type: 'chat_spike', value: recentMessages.length });
    }

    // Check for viral keywords in recent chat
    const recentText = recentMessages.map(m => m.message?.toLowerCase()).join(' ');
    const keywordMatches = CONFIG.thresholds.keywordMatch.filter(kw => 
      recentText.includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      indicators.push({ type: 'viral_keywords', matches: keywordMatches });
    }

    // Check viewer count spike (would need historical data)
    if (state.viewerCount > 5) {
      indicators.push({ type: 'viewers', count: state.viewerCount });
    }

    // Determine if clip-worthy
    const score = indicators.reduce((sum, i) => {
      if (i.type === 'chat_spike') return sum + 3;
      if (i.type === 'viral_keywords') return sum + 5;
      if (i.type === 'viewers') return sum + 1;
      return sum;
    }, 0);

    const detected = score >= 5;

    if (detected) {
      const clip = {
        id: `clip_${Date.now()}`,
        timestamp: new Date().toISOString(),
        score,
        indicators,
        viewerCount: state.viewerCount,
        messages: recentMessages.slice(-5),
        status: 'detected'
      };

      this.clips.push(clip);
      this.saveClips();

      return { detected: true, clip };
    }

    return { detected: false, score };
  }

  /**
   * Get pending clips for review
   */
  getPending() {
    return this.clips.filter(c => c.status === 'detected');
  }

  /**
   * Approve a clip for processing
   */
  approve(clipId) {
    const clip = this.clips.find(c => c.id === clipId);
    if (!clip) return null;

    clip.status = 'approved';
    clip.approvedAt = new Date().toISOString();
    this.saveClips();

    // In real implementation, this would:
    // 1. Extract 30-second video segment
    // 2. Generate subtitles
    // 3. Upload to storage
    // 4. Return shareable URL

    return clip;
  }

  /**
   * Get stats
   */
  stats() {
    return {
      total: this.clips.length,
      pending: this.getPending().length,
      approved: this.clips.filter(c => c.status === 'approved').length,
      posted: this.clips.filter(c => c.status === 'posted').length
    };
  }
}

// CLI
const detector = new ClipDetector();
const command = process.argv[2];

switch (command) {
  case 'detect':
    detector.detect().then(result => {
      if (result.detected) {
        console.log('🎬 CLIP DETECTED!');
        console.log(`Score: ${result.clip.score}`);
        console.log(`Indicators: ${result.clip.indicators.map(i => i.type).join(', ')}`);
        console.log(`Messages: ${result.clip.messages.length}`);
      } else {
        console.log(`No clip detected (score: ${result.score})`);
      }
    });
    break;

  case 'pending':
    const pending = detector.getPending();
    console.log(`Pending clips (${pending.length}):`);
    pending.forEach((clip, i) => {
      console.log(`\n${i + 1}. ${clip.id}`);
      console.log(`   Score: ${clip.score}`);
      console.log(`   Indicators: ${clip.indicators.map(i => i.type).join(', ')}`);
      console.log(`   Time: ${clip.timestamp}`);
    });
    break;

  case 'approve':
    const clipId = process.argv[3];
    if (!clipId) {
      console.error('Usage: clip.js approve <clip-id>');
      process.exit(1);
    }
    const approved = detector.approve(clipId);
    if (approved) {
      console.log('Approved clip:');
      console.log(approved);
    } else {
      console.error('Clip not found');
    }
    break;

  case 'stats':
    console.log(detector.stats());
    break;

  case 'watch':
    console.log('Watching for clips... (Ctrl+C to stop)');
    setInterval(async () => {
      const result = await detector.detect();
      if (result.detected) {
        console.log(`\n🎬 CLIP DETECTED at ${new Date().toLocaleTimeString()}`);
        console.log(`   Score: ${result.clip.score}`);
        console.log(`   Approve with: clip.js approve ${result.clip.id}`);
      }
    }, 10000); // Check every 10 seconds
    break;

  default:
    console.log(`
Stream Clip Detector

Usage:
  clip.js detect          Check if current moment is clip-worthy
  clip.js pending         Show pending clips for review
  clip.js approve <id>    Approve a clip for processing
  clip.js stats           Show detection statistics
  clip.js watch           Continuously monitor for clips

Examples:
  node clip.js detect
  node clip.js watch
  node clip.js approve clip_1234567890
    `);
}

module.exports = ClipDetector;
