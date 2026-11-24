import { createRoot } from "react-dom/client";
import "./ui/theme.css";
import { CampaignApp } from "./ui/CampaignApp";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<CampaignApp />);
