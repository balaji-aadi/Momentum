import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { EJSON } from 'bson';

dotenv.config();

async function createFullBackup() {
  console.log("================================================================================");
  console.log("STARTING COMPLETE MONGODB DATABASE BACKUP");
  console.log("================================================================================");

  const uri = process.env.DB_NAME 
    ? `${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin` 
    : process.env.MONGODB_URI;

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('database_backup');
  const timestampedBackupDir = path.resolve(`database_backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  if (!fs.existsSync(timestampedBackupDir)) {
    fs.mkdirSync(timestampedBackupDir, { recursive: true });
  }

  console.log(`Connected to Database: "${dbName}"`);
  console.log(`Primary Backup Directory: ${backupDir}`);
  console.log(`Timestamped Archive Directory: ${timestampedBackupDir}\n`);

  const collections = await db.listCollections().toArray();
  const summary = [];
  let totalDocsAllCollections = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    
    // Skip internal system collections
    if (colName.startsWith('system.')) continue;

    const collection = db.collection(colName);
    const count = await collection.countDocuments();
    const docs = await collection.find({}).toArray();
    const indexes = await collection.indexes();

    // Export documents using Canonical Extended JSON to preserve ObjectId, Date, Binary, Int64, etc.
    const ejsonContent = EJSON.stringify(docs, { relaxed: false }, 2);
    const indexesContent = JSON.stringify(indexes, null, 2);

    // Save to primary backup directory
    fs.writeFileSync(path.join(backupDir, `${colName}.json`), ejsonContent, 'utf-8');
    fs.writeFileSync(path.join(backupDir, `${colName}.indexes.json`), indexesContent, 'utf-8');

    // Save to timestamped archive directory
    fs.writeFileSync(path.join(timestampedBackupDir, `${colName}.json`), ejsonContent, 'utf-8');
    fs.writeFileSync(path.join(timestampedBackupDir, `${colName}.indexes.json`), indexesContent, 'utf-8');

    totalDocsAllCollections += count;
    summary.push({
      collection: colName,
      documentCount: count,
      fileSizeKb: (Buffer.byteLength(ejsonContent) / 1024).toFixed(2),
      indexesCount: indexes.length
    });

    console.log(`  ✓ Backed up "${colName}": ${count} documents, ${indexes.length} indexes (${(Buffer.byteLength(ejsonContent) / 1024).toFixed(2)} KB)`);
  }

  const metadata = {
    databaseName: dbName,
    backupCreatedAt: new Date().toISOString(),
    totalCollections: summary.length,
    totalDocuments: totalDocsAllCollections,
    collections: summary
  };

  fs.writeFileSync(path.join(backupDir, 'backup_metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
  fs.writeFileSync(path.join(timestampedBackupDir, 'backup_metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  // Create standalone one-click restore script inside the backup folder
  const restoreScriptContent = `import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EJSON } from 'bson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or local dir
const envPath = fs.existsSync(path.resolve(__dirname, '../.env')) 
  ? path.resolve(__dirname, '../.env') 
  : path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

async function restoreDatabase() {
  console.log("================================================================================");
  console.log("STARTING FULL DATABASE RESTORE FROM BACKUP");
  console.log("================================================================================");

  const uri = process.env.DB_NAME 
    ? \`\${process.env.MONGODB_URI}/\${process.env.DB_NAME}?authSource=admin\` 
    : process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ Error: MONGODB_URI not found in environment variables.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(\`Connected to target database: "\${db.databaseName}"\\n\`);

  const metadataFile = path.join(__dirname, 'backup_metadata.json');
  if (!fs.existsSync(metadataFile)) {
    console.error("❌ Error: backup_metadata.json not found in backup directory.");
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  console.log(\`Backup created at: \${metadata.backupCreatedAt}\`);
  console.log(\`Total collections to restore: \${metadata.totalCollections}\`);
  console.log(\`Total documents to restore: \${metadata.totalDocuments}\\n\`);

  let restoredCollections = 0;
  let restoredDocuments = 0;

  for (const item of metadata.collections) {
    const colName = item.collection;
    const jsonFile = path.join(__dirname, \`\${colName}.json\`);
    const indexFile = path.join(__dirname, \`\${colName}.indexes.json\`);

    if (!fs.existsSync(jsonFile)) {
      console.warn(\`⚠️ Warning: File \${colName}.json missing, skipping...\`);
      continue;
    }

    const rawContent = fs.readFileSync(jsonFile, 'utf-8');
    const docs = EJSON.parse(rawContent);

    const collection = db.collection(colName);
    
    // Clear target collection before inserting to prevent duplicate _id conflicts
    await collection.deleteMany({});

    if (docs.length > 0) {
      await collection.insertMany(docs, { ordered: false });
    }

    // Restore indexes if present
    if (fs.existsSync(indexFile)) {
      const indexes = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      for (const idx of indexes) {
        if (idx.name === '_id_') continue; // Default primary index already exists
        try {
          const { key, name, unique, sparse, background } = idx;
          const options = {};
          if (name) options.name = name;
          if (unique) options.unique = unique;
          if (sparse) options.sparse = sparse;
          if (background) options.background = background;
          await collection.createIndex(key, options);
        } catch (idxErr) {
          console.warn(\`  ⚠️ Index notice for \${colName} (\${idx.name}): \${idxErr.message}\`);
        }
      }
    }

    restoredCollections++;
    restoredDocuments += docs.length;
    console.log(\`  ✓ Restored "\${colName}": \${docs.length} documents\`);
  }

  await mongoose.disconnect();
  console.log("\\n================================================================================");
  console.log(\`🎉 RESTORE COMPLETE! Successfully restored \${restoredCollections} collections and \${restoredDocuments} documents.\`);
  console.log("================================================================================");
}

restoreDatabase().catch(console.error);
`;

  fs.writeFileSync(path.join(backupDir, 'restore_database.js'), restoreScriptContent, 'utf-8');
  fs.writeFileSync(path.join(timestampedBackupDir, 'restore_database.js'), restoreScriptContent, 'utf-8');

  // Also place a root-level restore_database.js in backend for quick access
  fs.writeFileSync(path.resolve('restore_database.js'), restoreScriptContent, 'utf-8');

  await mongoose.disconnect();

  console.log("\n================================================================================");
  console.log(`🎉 BACKUP COMPLETED SUCCESSFULLY!`);
  console.log(`Total Collections: ${summary.length}`);
  console.log(`Total Documents: ${totalDocsAllCollections}`);
  console.log(`Backup Location: ${backupDir}`);
  console.log(`Archive Location: ${timestampedBackupDir}`);
  console.log(`Restore Command: "node restore_database.js"`);
  console.log("================================================================================");
}

createFullBackup().catch(console.error);
