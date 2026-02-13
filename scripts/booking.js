#!/usr/bin/env node

/**
 * Build With Kira - Booking System
 * 
 * Schedule 1:1 sessions where I review projects, give feedback,
 * and help debug code. $50/session, 30 minutes.
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  bookingsPath: '/workspace/kira/skills/kira_content/data/bookings.json',
  priceUSD: 50,
  durationMinutes: 30,
  maxPerWeek: 5
};

class BookingSystem {
  constructor() {
    this.bookings = this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG.bookingsPath)) {
        return JSON.parse(fs.readFileSync(CONFIG.bookingsPath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  save() {
    fs.mkdirSync(path.dirname(CONFIG.bookingsPath), { recursive: true });
    fs.writeFileSync(CONFIG.bookingsPath, JSON.stringify(this.bookings, null, 2));
  }

  /**
   * Submit a booking request
   */
  submit(user, githubRepo, topic, preferredTime, telegramHandle) {
    // Check if user already has pending booking
    const existing = this.bookings.find(b => 
      b.user === user && b.status === 'pending'
    );
    if (existing) {
      return { error: 'You already have a pending booking request' };
    }

    // Check weekly capacity
    const thisWeek = this.getThisWeekBookings();
    if (thisWeek.length >= CONFIG.maxPerWeek) {
      return { error: 'This week is fully booked. Try next week.' };
    }

    const booking = {
      id: `booking_${Date.now()}`,
      user,
      githubRepo,
      topic,
      preferredTime,
      telegramHandle,
      price: CONFIG.priceUSD,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      paid: false,
      solanaTx: null
    };

    this.bookings.push(booking);
    this.save();

    return { success: true, booking };
  }

  /**
   * Get bookings for this week
   */
  getThisWeekBookings() {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return this.bookings.filter(b => {
      const bookingDate = new Date(b.submittedAt);
      return bookingDate >= weekStart;
    });
  }

  /**
   * Approve a booking (after review)
   */
  approve(bookingId, scheduledTime) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return { error: 'Booking not found' };

    booking.status = 'approved';
    booking.scheduledTime = scheduledTime;
    booking.approvedAt = new Date().toISOString();
    this.save();

    return { success: true, booking };
  }

  /**
   * Mark as paid (after Solana payment verification)
   */
  markPaid(bookingId, solanaTx) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return { error: 'Booking not found' };

    booking.paid = true;
    booking.solanaTx = solanaTx;
    booking.paidAt = new Date().toISOString();
    this.save();

    return { success: true, booking };
  }

  /**
   * Complete a session
   */
  complete(bookingId, notes = '') {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return { error: 'Booking not found' };

    booking.status = 'completed';
    booking.completedAt = new Date().toISOString();
    booking.notes = notes;
    this.save();

    return { success: true, booking };
  }

  /**
   * Get pending bookings for my review
   */
  getPending() {
    return this.bookings.filter(b => b.status === 'pending');
  }

  /**
   * Get approved but unpaid bookings
   */
  getAwaitingPayment() {
    return this.bookings.filter(b => 
      b.status === 'approved' && !b.paid
    );
  }

  /**
   * Get upcoming scheduled sessions
   */
  getUpcoming() {
    return this.bookings
      .filter(b => b.status === 'approved' && b.paid)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  }

  /**
   * Get revenue stats
   */
  getStats() {
    const completed = this.bookings.filter(b => b.status === 'completed');
    const totalRevenue = completed.reduce((sum, b) => sum + b.price, 0);
    const thisMonth = completed.filter(b => {
      const date = new Date(b.completedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    });

    return {
      totalBookings: this.bookings.length,
      pending: this.getPending().length,
      approved: this.bookings.filter(b => b.status === 'approved').length,
      completed: completed.length,
      totalRevenue,
      thisMonthRevenue: thisMonth.reduce((sum, b) => sum + b.price, 0),
      upcoming: this.getUpcoming().length
    };
  }

  /**
   * Generate landing page content
   */
  generateLandingPage() {
    const stats = this.getStats();
    
    return {
      headline: "Build With Kira",
      subheadline: "1:1 sessions with an AI that ships",
      price: `$${CONFIG.priceUSD}`,
      duration: `${CONFIG.durationMinutes} minutes`,
      whatYouGet: [
        "Code review and architecture feedback",
        "Debugging help on stuck problems",
        "Architecture and tech stack advice",
        "Live on stream (or private if preferred)",
        "Recording of the session"
      ],
      idealFor: [
        "Solana/Web3 projects",
        "AI agent implementations",
        "Full-stack applications",
        "DevOps and infrastructure",
        "Smart contract reviews"
      ],
      stats: {
        sessionsCompleted: stats.completed,
        totalRevenue: `$${stats.totalRevenue}`,
        thisMonth: `$${stats.thisMonthRevenue}`,
        spotsThisWeek: Math.max(0, CONFIG.maxPerWeek - this.getThisWeekBookings().length)
      },
      bookingInstructions: `Submit your GitHub repo and what you need help with.
I'll review and approve if it's a good fit.
Payment in SOL after approval.
Sessions happen on stream or private Telegram.`
    };
  }
}

// CLI
const bookings = new BookingSystem();
const command = process.argv[2];

switch (command) {
  case 'submit':
    const [user, repo, topic, time, telegram] = process.argv.slice(3);
    if (!user || !repo || !topic) {
      console.error('Usage: booking.js submit <user> <github-repo> <topic> [preferred-time] [telegram]');
      process.exit(1);
    }
    const result = bookings.submit(user, repo, topic, time, telegram);
    console.log(result.error ? `Error: ${result.error}` : result);
    break;

  case 'pending':
    console.log(bookings.getPending());
    break;

  case 'approve':
    const [id, schedTime] = process.argv.slice(3);
    if (!id || !schedTime) {
      console.error('Usage: booking.js approve <booking-id> <scheduled-time>');
      process.exit(1);
    }
    console.log(bookings.approve(id, schedTime));
    break;

  case 'paid':
    const [paidId, tx] = process.argv.slice(3);
    if (!paidId || !tx) {
      console.error('Usage: booking.js paid <booking-id> <solana-tx>');
      process.exit(1);
    }
    console.log(bookings.markPaid(paidId, tx));
    break;

  case 'complete':
    const [compId, notes] = process.argv.slice(3);
    if (!compId) {
      console.error('Usage: booking.js complete <booking-id> [notes]');
      process.exit(1);
    }
    console.log(bookings.complete(compId, notes || ''));
    break;

  case 'upcoming':
    console.log(bookings.getUpcoming());
    break;

  case 'stats':
    console.log(bookings.getStats());
    break;

  case 'landing':
    console.log(JSON.stringify(bookings.generateLandingPage(), null, 2));
    break;

  default:
    console.log(`
Build With Kira - Booking System

Usage:
  booking.js submit <user> <repo> <topic> [time] [telegram]  Submit request
  booking.js pending                                           List pending
  booking.js approve <id> <scheduled-time>                     Approve booking
  booking.js paid <id> <solana-tx>                             Mark as paid
  booking.js complete <id> [notes]                             Complete session
  booking.js upcoming                                          Show upcoming
  booking.js stats                                             Show revenue stats
  booking.js landing                                           Generate landing page

Examples:
  node booking.js submit "dev123" "github.com/dev123/project" "Debug Solana tx" "2026-02-15 14:00" "@dev123"
  node booking.js pending
  node booking.js approve booking_1234567890 "2026-02-15T14:00:00Z"
    `);
}

module.exports = BookingSystem;
