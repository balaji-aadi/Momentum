import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://balajiaadi2000_db_user:India%40123@ac-2ezrvfl-shard-00-00.31n62rt.mongodb.net:27017,ac-2ezrvfl-shard-00-01.31n62rt.mongodb.net:27017,ac-2ezrvfl-shard-00-02.31n62rt.mongodb.net:27017/task-management?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function restoreDatabase() {
  console.log("=================================================================");
  console.log("       SARTHI DATABASE RECOVERY & FULL RESTORE ENGINE           ");
  console.log("=================================================================\n");

  const defaultBackupDir = path.join(process.cwd(), "..", "database_backups", "LATEST");
  const backupDir = process.argv[2] || defaultBackupDir;

  if (!fs.existsSync(backupDir)) {
    console.error(`ERROR: Specified backup directory does not exist: ${backupDir}`);
    process.exit(1);
  }

  console.log(`Loading backup snapshot from: ${backupDir}`);
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✓ Connected successfully.");

  const db = mongoose.connection.db;
  const EJSON = mongoose.mongo.BSON.EJSON;

  const metadataPath = path.join(backupDir, "metadata.json");
  if (fs.existsSync(metadataPath)) {
    const meta = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    console.log(`\nSnapshot Details:`);
    console.log(`  Timestamp:        ${meta.timestamp}`);
    console.log(`  Target Database:  ${meta.database}`);
    console.log(`  Total Collections:${meta.totalCollections}`);
    console.log(`  Total Documents:  ${meta.totalDocuments}`);
  }

  const files = fs.readdirSync(backupDir);
  const restoredSummary = {};
  let totalRestoredDocs = 0;

  for (const file of files) {
    if (!file.endsWith(".json") || file === "metadata.json") continue;

    const collName = path.basename(file, ".json");
    const filePath = path.join(backupDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    let documents;
    try {
      documents = EJSON.parse(content);
    } catch (e) {
      documents = JSON.parse(content);
    }

    console.log(`Restoring collection: [${collName}] (${documents.length} docs)...`);
    const collection = db.collection(collName);

    // Clear collection before restoring full snapshot
    await collection.deleteMany({});

    if (documents.length > 0) {
      const docsToInsert = documents.map(doc => convertTypes(doc));
      await collection.insertMany(docsToInsert);
    }

    console.log(`  ✓ Restored ${documents.length} documents into [${collName}]`);
    restoredSummary[collName] = documents.length;
    totalRestoredDocs += documents.length;
  }

  console.log("\n=================================================================");
  console.log("               DATABASE FULL RECOVERY COMPLETED                 ");
  console.log("=================================================================");
  console.table(restoredSummary);
  console.log(`  Total Restored Documents: ${totalRestoredDocs}`);
  console.log("=================================================================");
  console.log("  STATUS: Database fully recovered to exact backup state!");
  console.log("=================================================================\n");

  process.exit(0);
}

function convertTypes(obj) {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof mongoose.Types.ObjectId || obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(obj)) {
      return new mongoose.Types.ObjectId(obj);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTypes);
  }

  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertTypes(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}

restoreDatabase().catch(err => {
  console.error("FATAL RESTORE ERROR:", err);
  process.exit(1);
});
