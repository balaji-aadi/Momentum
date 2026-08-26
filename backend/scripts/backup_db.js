import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://balajiaadi2000_db_user:India%40123@ac-2ezrvfl-shard-00-00.31n62rt.mongodb.net:27017,ac-2ezrvfl-shard-00-01.31n62rt.mongodb.net:27017,ac-2ezrvfl-shard-00-02.31n62rt.mongodb.net:27017/task-management?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function backupDatabase() {
  console.log("=================================================================");
  console.log("       SARTHI DATABASE SNAPSHOT & FULL BACKUP ENGINE             ");
  console.log("=================================================================\n");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✓ Connected successfully.");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, "-");
  
  // Save in main project database_backups directory
  const rootBackupDir = path.join(process.cwd(), "..", "database_backups");
  const timestampedBackupDir = path.join(rootBackupDir, `backup_${timestampStr}`);
  const latestBackupDir = path.join(rootBackupDir, "LATEST");

  fs.mkdirSync(timestampedBackupDir, { recursive: true });
  fs.mkdirSync(latestBackupDir, { recursive: true });

  console.log(`\nCreated backup target directory:\n  -> ${timestampedBackupDir}`);

  const summary = {};
  let totalDocs = 0;
  const EJSON = mongoose.mongo.BSON.EJSON;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith("system.")) continue; // Skip MongoDB internal system collections

    console.log(`Backing up collection: [${collName}]...`);
    const collection = db.collection(collName);
    const documents = await collection.find({}).toArray();

    // 1. Save to timestamped backup directory
    const serializedData = EJSON.stringify(documents, null, 2);
    const filePath = path.join(timestampedBackupDir, `${collName}.json`);
    fs.writeFileSync(filePath, serializedData, "utf8");

    // 2. Save to LATEST backup directory for 1-command auto-restore
    const latestFilePath = path.join(latestBackupDir, `${collName}.json`);
    fs.writeFileSync(latestFilePath, serializedData, "utf8");

    console.log(`  ✓ Saved ${documents.length} documents for [${collName}]`);
    summary[collName] = documents.length;
    totalDocs += documents.length;
  }

  const metaData = {
    timestamp: now.toISOString(),
    database: db.databaseName,
    totalCollections: Object.keys(summary).length,
    totalDocuments: totalDocs,
    collections: summary
  };

  // Write metadata.json
  const metaJson = JSON.stringify(metaData, null, 2);
  fs.writeFileSync(path.join(timestampedBackupDir, "metadata.json"), metaJson, "utf8");
  fs.writeFileSync(path.join(latestBackupDir, "metadata.json"), metaJson, "utf8");

  console.log("\n=================================================================");
  console.log("                 FULL DATABASE BACKUP SUMMARY                    ");
  console.log("=================================================================");
  console.table(summary);
  console.log(`  Total Collections Backed Up: ${Object.keys(summary).length}`);
  console.log(`  Total Documents Saved:       ${totalDocs}`);
  console.log("=================================================================");
  console.log(`\nBackup Folder: ${timestampedBackupDir}`);
  console.log(`Latest Pointer: ${latestBackupDir}`);
  console.log("\nTo restore the full database at any time, run 1 command:");
  console.log("  npm run db:restore");
  console.log("=================================================================\n");

  process.exit(0);
}

backupDatabase().catch(err => {
  console.error("FATAL DATABASE BACKUP ERROR:", err);
  process.exit(1);
});
