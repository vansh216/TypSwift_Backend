// ─────────────────────────────────────────
// TypSwift — MongoDB Initialization Script
//
// Runs ONLY on first container start
// when the data volume is empty.
//
// Runs again only if you run:
// docker-compose down -v
// ─────────────────────────────────────────

// Switch to typswift database
const db = db.getSiblingDB('typswift');

// ─────────────────────────────────────────
// Step 1 — Create application user
// ─────────────────────────────────────────
db.createUser({
  user : 'typswift_user',
  pwd  : 'typswift_pass',
  roles: [
    {
      role: 'readWrite',
      db  : 'typswift',
    },
  ],
});

print('Step 1 — App user created');

// ─────────────────────────────────────────
// Step 2 — Create collections
// ─────────────────────────────────────────
db.createCollection('users');
db.createCollection('testresults');
db.createCollection('paragraphs');

print('Step 2 — Collections created');

// ─────────────────────────────────────────
// Step 3 — Create indexes
// ─────────────────────────────────────────

// ── Users ──
db.users.createIndex(
  { email: 1 },
  { unique: true, name: 'idx_users_email' }
);
db.users.createIndex(
  { username: 1 },
  { unique: true, name: 'idx_users_username' }
);

print('Step 3a — User indexes created');

// ── TestResults ──
db.testresults.createIndex(
  { userId: 1 },
  { name: 'idx_results_userId' }
);
db.testresults.createIndex(
  { wpm: -1 },
  { name: 'idx_results_wpm' }
);
db.testresults.createIndex(
  { createdAt: -1 },
  { name: 'idx_results_createdAt' }
);
db.testresults.createIndex(
  { userId: 1, createdAt: -1 },
  { name: 'idx_results_userId_date' }
);
db.testresults.createIndex(
  { userId: 1, wpm: -1 },
  { name: 'idx_results_userId_wpm' }
);
db.testresults.createIndex(
  { userId: 1, duration: 1, wpm: -1 },
  { name: 'idx_results_userId_duration_wpm' }
);

print('Step 3b — TestResult indexes created');

// ── Paragraphs ──
db.paragraphs.createIndex(
  { difficulty: 1 },
  { name: 'idx_paragraphs_difficulty' }
);
db.paragraphs.createIndex(
  { suitableFor: 1 },
  { name: 'idx_paragraphs_suitableFor' }
);
db.paragraphs.createIndex(
  { isActive: 1 },
  { name: 'idx_paragraphs_isActive' }
);
db.paragraphs.createIndex(
  { difficulty: 1, isActive: 1, suitableFor: 1 },
  { name: 'idx_paragraphs_main' }
);

print('Step 3c — Paragraph indexes created');

// ─────────────────────────────────────────
// Step 4 — Run your seed script separately
// npm run seed
// ─────────────────────────────────────────
print('');
print('🚀 TypSwift MongoDB initialized successfully!');
print('📦 Database   : typswift');
print('👤 App user   : typswift_user');
print('📝 Collections: users, testresults, paragraphs');
print('⚡ Indexes    : all created');
print('');
print('ℹ️  Run your seed script to add paragraphs:');
print('   npm run seed');
print('');
print('ℹ️  This script will NOT run again unless');
print('   you run: docker-compose down -v');