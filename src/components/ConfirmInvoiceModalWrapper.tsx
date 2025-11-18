"use client";
import { ConfirmInvoiceModal } from "./ConfirmInvoiceModal";

interface ClientData {
  id: string;
  name: string;
}

export function ConfirmInvoiceModalWrapper({ client }: { client: ClientData }) {
  return (
    <ConfirmInvoiceModal client={client} onCreated={() => window.location.reload()} />
  );
}
