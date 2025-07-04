import { db } from "./index";

async function createTodosTable() {
  try {
    console.log("Creating todos table...");
    
    // Create the todos table directly
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "is_completed" boolean DEFAULT false,
        "is_default" boolean DEFAULT false,
        "category" varchar(50),
        "priority" varchar(20) DEFAULT 'medium',
        "due_date" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Create index for user_id for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "todos_user_id_idx" ON "todos" ("user_id");
    `);
    
    // Create index for created_at for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "todos_created_at_idx" ON "todos" ("created_at");
    `);
    
    // Add foreign key constraint
    await db.execute(`
      ALTER TABLE "todos" 
      ADD CONSTRAINT "todos_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") 
      ON DELETE CASCADE;
    `);
    
    console.log("✅ Todos table created successfully!");
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log("✅ Todos table already exists");
    } else {
      console.error("❌ Error creating todos table:", error);
    }
  }
}

createTodosTable()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '42703',
    position: '47',
    file: 'parse_target.c',
    line: '1065',
    routine: 'checkInsertTargets'
  }
}
bash-5.2$ cd "/home/kuro/Downloads/project-bolt-sb1-3tyy5uhi (1)/project" && npm run db:push

> nextjs@0.1.0 db:push
> drizzle-kit push

No config path provided, using default 'drizzle.config.ts'
Reading config file '/home/kuro/Downloads/project-bolt-sb1-3tyy5uhi (1)/project/drizzle.config.ts'
 Error  Either connection "url" or "host", "database" are required for PostgreSQL database connection
        "description" text,
        "is_completed" boolean DEFAULT false,
        "is_default" boolean DEFAULT false,
        "category" varchar(50),
        "priority" varchar(20) DEFAULT 'medium',
        "due_date" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Create index for user_id for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "todos_user_id_idx" ON "todos" ("user_id");
    `);
    
    // Create index for created_at for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "todos_created_at_idx" ON "todos" ("created_at");
    `);
    
    // Add foreign key constraint
    await db.execute(`
      ALTER TABLE "todos" 
      ADD CONSTRAINT "todos_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") 
      ON DELETE CASCADE;
    `);
    
    console.log("✅ Todos table created successfully!");
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log("✅ Todos table already exists");
    } else {
      console.error("❌ Error creating todos table:", error);
    }
  }
}

createTodosTable()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
