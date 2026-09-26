import LegalPage from "../components/LegalPage";
import { LEGAL_DOCS } from "../content/legal";
import type { LegalId } from "../content/legal";

export default function Policy({ id }: { id: LegalId }) {
  return <LegalPage doc={LEGAL_DOCS[id]} />;
}
