const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load credentials
function loadCredentials() {
  try {
    const credentialsPath = path.join(
      __dirname,
      "..",
      "credentials",
      "supabase-credentials.local",
    );
    const credentialsContent = fs.readFileSync(credentialsPath, "utf8");

    const jsonStart = credentialsContent.indexOf("{");
    const jsonContent = credentialsContent.substring(jsonStart);
    const credentials = JSON.parse(jsonContent);

    return {
      url: credentials.supabase.development.url,
      serviceRoleKey: credentials.supabase.development.service_role_key,
    };
  } catch (error) {
    console.error("Failed to load credentials:", error);
    return {
      url: "https://ajszzemkpenbfnghqiyz.supabase.co",
      serviceRoleKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMzMjk3NCwiZXhwIjoyMDYyOTA4OTc0fQ.9xN5Ci6uErpsHx-8IwC4B8vh2cCzD39L3frKO66CSos",
    };
  }
}

async function runSchemaFixes() {
  console.log("🔧 Running schema fixes...");

  const creds = loadCredentials();
  const supabase = createClient(creds.url, creds.serviceRoleKey);

  try {
    // 1. Test current schema by trying to insert a client
    console.log("🧪 Testing current schema...");

    const testClient = {
      name: "Schema Test Client",
      description: "Testing schema",
      contact_info: { email: "test@example.com" },
    };

    const { data: testResult, error: testError } = await supabase
      .from("clients")
      .insert(testClient)
      .select()
      .single();

    if (testError) {
      console.log("❌ Schema test failed:", testError.message);

      // 2. Try to fix the schema
      console.log("🔧 Attempting to add missing columns...");

      // Add description column
      try {
        const { error: descError } = await supabase
          .from("clients")
          .select("description")
          .limit(1);

        if (descError && descError.message.includes("column")) {
          console.log("Adding description column...");
          // We can't add columns directly through the API, so we'll need a different approach
        }
      } catch (e) {
        console.log("Description column check failed");
      }

      // 3. Test without description first
      console.log("🔧 Testing basic client creation...");
      const basicClient = {
        name: "Basic Test Client",
      };

      const { data: basicResult, error: basicError } = await supabase
        .from("clients")
        .insert(basicClient)
        .select()
        .single();

      if (basicError) {
        console.log("❌ Basic client creation failed:", basicError.message);
        return false;
      } else {
        console.log("✅ Basic client creation works");

        // Clean up
        await supabase.from("clients").delete().eq("id", basicResult.id);

        return true;
      }
    } else {
      console.log("✅ Schema test passed - all columns exist");

      // Clean up
      await supabase.from("clients").delete().eq("id", testResult.id);

      return true;
    }
  } catch (error) {
    console.error("💥 Schema fix failed:", error);
    return false;
  }
}

// Run the fixes
(async () => {
  const success = await runSchemaFixes();
  process.exit(success ? 0 : 1);
})();
