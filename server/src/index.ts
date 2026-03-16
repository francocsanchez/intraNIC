import colors from "colors";
import server from "./server";

const port = process.env.PORT || 4002;

server.listen(Number(port), "0.0.0.0", () => {
  console.log("\n" + "🚀 SERVIDOR INICIADO".bgGreen.white);
  console.log(colors.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(`${colors.yellow("📡 API:")} ${colors.white("REST API running")}`);
  console.log(`${colors.yellow("🌐 URL:")} ${colors.underline(`http://localhost:${port}`)}`);
  console.log(`${colors.yellow("⚙️  ENV:")} ${colors.green(process.env.NODE_ENV || "development")}`);
  console.log(colors.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") + "\n");
});