"use client";

import Script from "next/script";
import { useEffect } from "react";

const ACTION_NETWORK_CSS =
  "https://actionnetwork.org/css/style-embed-v3.css";
const ACTION_NETWORK_SCRIPT =
  "https://actionnetwork.org/widgets/v6/form/subscribe-77?format=js&source=widget";

/**
 * Scoped overrides: strip Action Network chrome and hide the Name row so only
 * the email field (+ submit / opt-in) show. Adjust selectors if AN changes markup.
 */
const MINIMAL_EMBED_CSS = `
/* Hide logo, sponsored block, welcome */
#can-form-area-subscribe-77 #logo_wrap,
#can-form-area-subscribe-77 #action_info,
#can-form-area-subscribe-77 #action_welcome_message,
#can-form-area-subscribe-77 .can_embed #action_info {
  display: none !important;
}
/* Hide big titles / subheaders above the form */
#can-form-area-subscribe-77 .can_embed > h1,
#can-form-area-subscribe-77 .can_embed > h2,
#can-form-area-subscribe-77 .can_embed > h3,
#can-form-area-subscribe-77 .can_embed > h4,
#can-form-area-subscribe-77 .can_embed #can_main_col > h1,
#can-form-area-subscribe-77 .can_embed #can_main_col > h2,
#can-form-area-subscribe-77 .can_embed #can_main_col > h3,
#can-form-area-subscribe-77 .can_embed #can_main_col > h4 {
  display: none !important;
}
/* Hide dividers */
#can-form-area-subscribe-77 .can_embed #can_embed_form hr,
#can-form-area-subscribe-77 .can_embed hr {
  display: none !important;
}
/* Flatten card chrome */
#can-form-area-subscribe-77 .can_embed #can_embed_form,
#can-form-area-subscribe-77 .can_embed {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
/* Button color */
#can-form-area-subscribe-77 .can_embed #can_embed_form input[type="submit"],
#can-form-area-subscribe-77 .can_embed .can_button {
  background-color: var(--primary-orange, #b85c3e) !important;
  border: none !important;
}
/* Hide Name field row — keep email only (whole list item containing text input) */
#can-form-area-subscribe-77 #can_embed_form li:has(input[type="text"]) {
  display: none !important;
}
`;

const MINIMAL_STYLE_ID = "action-network-minimal-subscribe-77";

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
  }, []);

  return (
    <>
      <Script src={ACTION_NETWORK_SCRIPT} strategy="afterInteractive" />
      <div id="can-form-area-subscribe-77" className="w-full" />
    </>
  );
}
