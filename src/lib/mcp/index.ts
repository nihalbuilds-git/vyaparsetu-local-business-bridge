import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getBusinessProfile from "./tools/get-business-profile";
import listWorkers from "./tools/list-workers";
import listKhataEntries from "./tools/list-khata-entries";
import addKhataEntry from "./tools/add-khata-entry";
import listInventory from "./tools/list-inventory";
import listExpenses from "./tools/list-expenses";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vyaparsetu-mcp",
  title: "VyaparSetu",
  version: "0.1.0",
  instructions:
    "Tools for VyaparSetu — the Indian shopkeeper business manager. Use get_business_profile first to fetch the user's business ID (needed for creating Khata entries). Read workers, khata (credit ledger), inventory, and expenses. Amounts are in INR (₹).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getBusinessProfile, listWorkers, listKhataEntries, addKhataEntry, listInventory, listExpenses],
});
