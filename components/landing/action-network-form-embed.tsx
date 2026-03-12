"use client";

import Script from "next/script";
import { useEffect } from "react";

const ACTION_NETWORK_CSS =
  "https://actionnetwork.org/css/style-embed-v3.css";
const ACTION_NETWORK_SCRIPT =
  "https://actionnetwork.org/widgets/v6/form/subscribe-77?format=js&source=widget";

/**
 * Strip AN chrome: headings ("Subscribe to What We Will", "SUBSCRIBE TO OUR…"),
 * logo, dividers. Keep email input + subscribe button + opt-in.
 * If Name still appears, remove that field in the Action Network form editor.
 */
const MINIMAL_EMBED_CSS = `
/* Hide logo / sponsored / welcome */
#can-form-area-subscribe-77 #logo_wrap,
#can-form-area-subscribe-77 #action_info,
#can-form-area-subscribe-77 #action_welcome_message,
#can-form-area-subscribe-77 .can_embed #action_info {
  display: none !important;
}

/* Kill all headings inside embed — removes "Subscribe to What We Will" and
   "SUBSCRIBE TO OUR MAILING LIST" (AN puts them in h2/h4 or similar) */
#can-form-area-subscribe-77 .can_embed h1,
#can-form-area-subscribe-77 .can_embed h2,
#can-form-area-subscribe-77 .can_embed h3,
#can-form-area-subscribe-77 .can_embed h4,
#can-form-area-subscribe-77 .can_embed h5,
#can-form-area-subscribe-77 .can_embed h6 {
  display: none !important;
}

/* Common AN title wrapper (if titles live in divs with these classes) */
#can-form-area-subscribe-77 .can_embed .action_title,
#can-form-area-subscribe-77 .can_embed #action_title,
#can-form-area-subscribe-77 .can_embed .embed_title {
  display: none !important;
}

/* Hide horizontal rules left after hiding headings */
#can-form-area-subscribe-77 .can_embed hr,
#can-form-area-subscribe-77 .can_embed #can_embed_form hr {
  display: none !important;
}

/* Flatten outer card */
#can-form-area-subscribe-77 .can_embed,
#can-form-area-subscribe-77 .can_embed #can_embed_form {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* Email + button in one row on wide screens */
#can-form-area-subscribe-77 #can_embed_form form ul,
#can-form-area-subscribe-77 #can_embed_form ul {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: flex-end !important;
  gap: 0.5rem 0.75rem !important;
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
#can-form-area-subscribe-77 #can_embed_form li {
  margin: 0 !important;
}
/* Inputs visible (AN sometimes uses type="text" for email — do NOT hide text inputs globally) */
#can-form-area-subscribe-77 #can_embed_form input[type="email"],
#can-form-area-subscribe-77 #can_embed_form input[type="text"] {
  display: block !important;
  min-height: 2.5rem !important;
}
/* Hide only the Name row when AN uses a dedicated name field */
#can-form-area-subscribe-77 #can_embed_form li:has(input[placeholder*="Name" i]),
#can-form-area-subscribe-77 #can_embed_form li:has(input[name*="first_name" i]),
#can-form-area-subscribe-77 #can_embed_form li:has(input#form-first_name),
#can-form-area-subscribe-77 #can_embed_form li:has(input#form-last_name) {
  display: none !important;
}

/* Submit button */
#can-form-area-subscribe-77 .can_embed #can_embed_form input[type="submit"],
#can-form-area-subscribe-77 .can_embed .can_button {
  background-color: var(--primary-orange, #b85c3e) !important;
  border: none !important;
}
/* Opt-in row full width below */
#can-form-area-subscribe-77 #can_embed_form li:has(input[type="checkbox"]) {
  flex-basis: 100% !important;
}
`;

const MINIMAL_STYLE_ID = "action-network-minimal-subscribe-77";

function hideHeadingNodesByText() {
  const root = document.getElementById("can-form-area-subscribe-77");
  if (!root) return;
  const walk = root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, div");
  walk.forEach((el) => {
    const t = (el.textContent || "").trim();
    if (
      t === "Subscribe to What We Will" ||
      t === "SUBSCRIBE TO OUR MAILING LIST" ||
      t.toLowerCase() === "subscribe to our mailing list"
    ) {
      (el as HTMLElement).style.display = "none";
      // Hide following hr if present
      const next = el.nextElementSibling;
      if (next && next.tagName === "HR") (next as HTMLElement).style.display = "none";
    }
  });
}

export function ActionNetworkFormEmbed() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${ACTION_NETWORK_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = ACTION_NETWORK_CSS;
      link.type = "text/css";
      document.head.appendChild(link);
    }
    if (!document.getElementById(MINIMAL_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = MINIMAL_STYLE_ID;
      style.textContent = MINIMAL_EMBED_CSS;
      document.head.appendChild(style);
    }
    // AN injects async — retry a few times to catch late-rendered headings
    const t1 = setTimeout(hideHeadingNodesByText, 500);
    const t2 = setTimeout(hideHeadingNodesByText, 1500);
    const t3 = setTimeout(hideHeadingNodesByText, 3000);
    const obs = new MutationObserver(() => hideHeadingNodesByText());
    const root = document.getElementById("can-form-area-subscribe-77");
    if (root) obs.observe(root, { childList: true, subtree: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <Script src={ACTION_NETWORK_SCRIPT} strategy="afterInteractive" />
      <div id="can-form-area-subscribe-77" className="w-full" />
    </>
  );
}
