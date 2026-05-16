import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Paragraph from '../src/model/Paragraph.model.js';
import { DB_Name } from '../constant.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seed = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(`${process.env.MONGO_URI}/${DB_Name}`);
    console.log('✅ MongoDB connected');

    // 2. Read paragraphs.json
    const filePath = path.join(__dirname, '../data/paragraphs.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const paragraphs = JSON.parse(rawData);

    console.log(`📄 Found ${paragraphs.length} paragraphs in JSON file`);

    let inserted = 0;
    let skipped = 0;

    // 3. Insert one by one — skip duplicates
    for (const para of paragraphs) {
      const exists = await Paragraph.findOne({ content: para.content });

      if (exists) {
        skipped++;
        continue;
      }

      await Paragraph.create(para);
      inserted++;
    }

    console.log(`Inserted : ${inserted} paragraphs`);
    console.log(`Skipped  : ${skipped} duplicates`);
    console.log('Seeding complete!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

const freshSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Paragraph.deleteMany({});
    console.log('Cleared existing paragraphs');

    const filePath = path.join(__dirname, '../data/paragraphs.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const paragraphs = JSON.parse(rawData);

    await Paragraph.insertMany(paragraphs);
    console.log(`Inserted ${paragraphs.length} paragraphs`);
    console.log('Fresh seed complete!');

    process.exit(0);
  } catch (error) {
    console.error('Fresh seed failed:', error.message);
    process.exit(1);
  }
};

// Check which mode was called
const mode = process.argv[2];
if (mode === '--fresh') {
  freshSeed();
} else {
  seed();
}