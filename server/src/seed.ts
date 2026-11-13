import { DEMO_EMAIL, DEMO_PASSWORD, seedDemo } from "./demo.js";

const result = seedDemo({ reset: true });

console.log(`Seed concluido: ${result.count} candidaturas criadas.`);
console.log(`Login demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
