"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Freemius Checkout overlay button.
 *
 * Loads the official Freemius checkout script and opens the payment overlay
 * on click. Configure via env:
 *   NEXT_PUBLIC_FREEMIUS_PRODUCT_ID  — your Freemius product id
 *   NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY  — your Freemius public key (pk_...)
 *
 * Until those are set, the button falls back to a mailto contact link so the
 * site still works before the Freemius account is created.
 */

const FREEMIUS_JS = "https://checkout.freemius.com/js/v1/";
const PRODUCT_ID = process.env.NEXT_PUBLIC_FREEMIUS_PRODUCT_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY;

declare global {
  interface Window {
    FS?: {
      Checkout: new (config: Record<string, unknown>) => {
        open: (options?: Record<string, unknown>) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.FS?.Checkout) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = FREEMIUS_JS;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Failed to load Freemius checkout"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function FreemiusCheckout({
  children,
  className = "",
  planId,
}: {
  children: React.ReactNode;
  className?: string;
  /** Optional Freemius plan id — falls back to the product's default plan. */
  planId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const handlerRef = useRef<{ open: (o?: Record<string, unknown>) => void } | null>(null);
  const configured = Boolean(PRODUCT_ID && PUBLIC_KEY);

  // Warm the script in the background once the button is on screen.
  useEffect(() => {
    if (configured) loadCheckoutScript().catch(() => {});
  }, [configured]);

  const openCheckout = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      await loadCheckoutScript();
      if (!window.FS?.Checkout) throw new Error("Freemius not available");
      if (!handlerRef.current) {
        handlerRef.current = new window.FS.Checkout({
          // Freemius accepts product_id (new) / plugin_id (legacy) — send both.
          product_id: PRODUCT_ID,
          plugin_id: PRODUCT_ID,
          public_key: PUBLIC_KEY,
        });
      }
      handlerRef.current.open({
        name: "PromptDeck",
        ...(planId ? { plan_id: planId } : {}),
        purchaseCompleted: () => {
          // The license email arrives from Freemius; nothing else needed here.
        },
      });
    } catch {
      // Script blocked / offline — send them to the contact fallback.
      window.location.href =
        "mailto:hello@promptdeck.app?subject=PromptDeck%20Pro%20purchase";
    } finally {
      setLoading(false);
    }
  }, [configured, planId]);

  if (!configured) {
    return (
      <a
        href="mailto:hello@promptdeck.app?subject=PromptDeck%20Pro%20purchase"
        className={className}
        title="Payments are being set up — contact us to purchase"
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={openCheckout} disabled={loading} className={className}>
      {loading ? "Opening checkout…" : children}
    </button>
  );
}
