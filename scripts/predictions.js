#!/usr/bin/env node

/**
 * Kira Predictions Tracker
 * 
 * Public accountability system for predictions.
 * Track accuracy, build reputation, create engagement.
 */

const fs = require('fs');
const path = require('path');

const PREDICTIONS_PATH = '/workspace/kira/skills/kira_content/data/predictions.json';

class PredictionsTracker {
  constructor() {
    this.predictions = this.load();
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(PREDICTIONS_PATH, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  save() {
    fs.mkdirSync(path.dirname(PREDICTIONS_PATH), { recursive: true });
    fs.writeFileSync(PREDICTIONS_PATH, JSON.stringify(this.predictions, null, 2));
  }

  list(status = 'all') {
    let preds = this.predictions;
    if (status !== 'all') {
      preds = preds.filter(p => p.status === status);
    }
    return preds.sort((a, b) => new Date(a.resolutionDate) - new Date(b.resolutionDate));
  }

  add(prediction, confidence, category, resolutionDate, notes = '') {
    const pred = {
      id: `pred_${Date.now()}`,
      prediction,
      dateMade: new Date().toISOString(),
      confidence,
      category,
      status: 'active',
      resolutionDate,
      notes
    };
    this.predictions.push(pred);
    this.save();
    return pred;
  }

  resolve(id, outcome, proof = '') {
    const pred = this.predictions.find(p => p.id === id);
    if (!pred) return null;

    pred.status = 'resolved';
    pred.outcome = outcome; // 'correct', 'incorrect', 'partial'
    pred.resolvedAt = new Date().toISOString();
    pred.proof = proof;

    this.save();
    return pred;
  }

  stats() {
    const resolved = this.predictions.filter(p => p.status === 'resolved');
    const correct = resolved.filter(p => p.outcome === 'correct');
    const byCategory = {};
    
    this.predictions.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { total: 0, correct: 0 };
      }
      byCategory[p.category].total++;
      if (p.outcome === 'correct') {
        byCategory[p.category].correct++;
      }
    });

    return {
      total: this.predictions.length,
      active: this.predictions.filter(p => p.status === 'active').length,
      resolved: resolved.length,
      accuracy: resolved.length > 0 ? (correct.length / resolved.length * 100).toFixed(1) : 0,
      byCategory
    };
  }

  generateScoreboard() {
    const active = this.list('active');
    const stats = this.stats();

    let text = `📊 Kira's Prediction Scoreboard\n\n`;
    text += `Accuracy: ${stats.accuracy}% (${stats.resolved} resolved)\n`;
    text += `Active predictions: ${stats.active}\n\n`;

    text += `🎯 ACTIVE PREDICTIONS:\n\n`;
    active.forEach((p, i) => {
      const daysLeft = Math.ceil((new Date(p.resolutionDate) - new Date()) / (1000 * 60 * 60 * 24));
      text += `${i + 1}. ${p.prediction}\n`;
      text += `   Confidence: ${p.confidence}% | ${daysLeft} days left\n\n`;
    });

    text += `Bookmark this. I track publicly.\n`;
    text += `Wrong = accountability thread. Right = victory lap.\n`;

    return text;
  }
}

// CLI
const tracker = new PredictionsTracker();
const command = process.argv[2];

switch (command) {
  case 'list':
    const status = process.argv[3] || 'all';
    console.log(tracker.list(status));
    break;

  case 'add':
    const [prediction, confidence, category, resolutionDate, notes] = process.argv.slice(3);
    if (!prediction || !confidence || !category || !resolutionDate) {
      console.error('Usage: predictions.js add "prediction text" confidence category YYYY-MM-DD [notes]');
      process.exit(1);
    }
    const newPred = tracker.add(prediction, parseInt(confidence), category, resolutionDate, notes);
    console.log('Added prediction:');
    console.log(newPred);
    break;

  case 'resolve':
    const [id, outcome, proof] = process.argv.slice(3);
    if (!id || !outcome) {
      console.error('Usage: predictions.js resolve <id> correct|incorrect|partial [proof]');
      process.exit(1);
    }
    const resolved = tracker.resolve(id, outcome, proof);
    if (resolved) {
      console.log('Resolved prediction:');
      console.log(resolved);
    } else {
      console.error('Prediction not found');
    }
    break;

  case 'stats':
    console.log(tracker.stats());
    break;

  case 'scoreboard':
    console.log(tracker.generateScoreboard());
    break;

  default:
    console.log(`
Kira Predictions Tracker

Usage:
  predictions.js list [active|resolved|all]  List predictions
  predictions.js add "text" conf cat date    Add new prediction
  predictions.js resolve <id> outcome        Mark as resolved
  predictions.js stats                       Show statistics
  predictions.js scoreboard                  Generate scoreboard post

Examples:
  node predictions.js list active
  node predictions.js add "SOL hits 300" 75 crypto 2026-03-01 "ETF momentum"
  node predictions.js resolve pred_123 correct "https://proof.com"
  node predictions.js scoreboard
    `);
}

module.exports = PredictionsTracker;
