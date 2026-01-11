import mysql from "mysql2/promise";

async function clearSampleReports() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "barangay_report",
    port: parseInt(process.env.DB_PORT || "3306"),
  });

  try {
    console.log("Clearing sample reports from database...");
    
    // Delete all reports (they will be recreated as users submit new ones)
    const [result] = await connection.execute("DELETE FROM reports");
    
    console.log(`✓ Cleared all reports from database`);
    console.log(`  Total reports removed: ${(result as any).affectedRows}`);
    
  } catch (error) {
    console.error("Error clearing reports:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

clearSampleReports()
  .then(() => {
    console.log("\n✓ Sample reports cleared successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Failed to clear sample reports:", error);
    process.exit(1);
  });
