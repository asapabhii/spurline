import { closeDatabase, getDatabase } from '../config/database.js';
import { generateId } from '../utils/id.js';
import { logger } from '../utils/logger.js';

/**
 * Seed data for development/demo purposes
 * Creates a sample conversation with messages
 */
function seedDatabase(): void {
  const db = getDatabase();

  // Check if data already exists
  const existingConversations = db
    .prepare('SELECT COUNT(*) as count FROM conversations')
    .get() as { count: number };

  if (existingConversations.count > 0) {
    logger.info('Database already seeded, skipping');
    closeDatabase();
    return;
  }

  logger.info('Seeding database...');

  const conversationId = generateId();
  const now = new Date();

  db.transaction(() => {
    // Create sample conversation
    db.prepare(`
      INSERT INTO conversations (id, created_at, channel, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      conversationId,
      now.toISOString(),
      'web',
      JSON.stringify({ source: 'seed' }),
    );

    // Create sample messages
    const messages = [
      {
        content: 'Hi, I have a question about shipping.',
        id: generateId(),
        sender: 'user',
        timestamp: new Date(now.getTime() - 60000).toISOString(),
      },
      {
        content: 'Hello! I\'d be happy to help you with shipping information. We offer free shipping on orders over $50, with standard delivery taking 5-7 business days. What would you like to know?',
        id: generateId(),
        sender: 'ai',
        timestamp: new Date(now.getTime() - 55000).toISOString(),
      },
      {
        content: 'Do you ship internationally?',
        id: generateId(),
        sender: 'user',
        timestamp: new Date(now.getTime() - 30000).toISOString(),
      },
      {
        content: 'Yes, we do ship internationally! International shipping rates vary by destination and typically take 10-14 business days. You can see the exact shipping cost at checkout after entering your address. Is there a specific country you\'re shipping to?',
        id: generateId(),
        sender: 'ai',
        timestamp: new Date(now.getTime() - 25000).toISOString(),
      },
    ];

    const insertMessage = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const msg of messages) {
      insertMessage.run(msg.id, conversationId, msg.sender, msg.content, msg.timestamp);
    }
  })();

  logger.info('Database seeded successfully', { conversationId });
  closeDatabase();
}

// Run if executed directly
seedDatabase();

