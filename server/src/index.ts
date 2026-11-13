import { createApp } from "./app.js";
import { config } from "./config.js";
import { autoSeedIfEmpty } from "./demo.js";

if (process.env.SEED_DEMO !== "false") {
  autoSeedIfEmpty();
}

const app = createApp();

app.listen(config.port, () => {
  console.log(`API do DevTrack rodando em http://localhost:${config.port}`);
  console.log(`Banco SQLite: ${config.dbPath}`);
});
