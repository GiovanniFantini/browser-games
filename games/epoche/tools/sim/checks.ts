import { loadContent } from "@content/index";
import { checkBalance } from "./verification";

const failures = checkBalance(loadContent());
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    "Bilanciamento verificato per 5 semi: 1.000 anni in idle, 3.000 in growth.",
  );
}
