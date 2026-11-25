import { createRoot } from "react-dom/client";
import "./ui/theme.css";
import { CampaignApp } from "./ui/CampaignApp";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
const app = createRoot(root);
if (new URLSearchParams(location.search).has("valle")) {
  void import("./valley/Valley").then(({default: Valley}) => app.render(<Valley />));
} else {
  app.render(<CampaignApp />);
}
