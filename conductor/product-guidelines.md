# Product Guidelines - B2B Product Exhibition Website

## Prose Style
- **Tone:** Instructive & Helpful.
- **Approach:** Content should guide the user clearly, offering expert-level information in an approachable manner. It should focus on providing value and clarity, avoiding unnecessary complexity.

## User Experience (UX) Principles
- **Performance First:** Prioritize low latency and fast interactions, leveraging Cloudflare's edge capabilities for a snappy global experience.
- **Accessibility (WCAG):** Ensure the website is accessible to all industrial buyers, adhering to WCAG standards for inclusivity and broad compatibility.
- **Visual-Centric Design:** Implement a clean, professional layout that emphasizes high-quality product images, ensuring visual clarity is maintained across all devices.

## Branding & Consistency
- **Visual Consistency:** Maintain a strict, consistent color palette and logo placement across every page to reinforce brand identity.
- **Unified Experience:** The design and interaction patterns should remain seamless between the public-facing exhibition site and the internal admin dashboard.
- **Resource Richness:** Provide a wealth of information, including downloadable technical documents, to establish authority and trust with wholesale partners.

## Technical Implementation
- **Separation of Concerns:** Maintain a clean architectural boundary between the Cloudflare Worker backend and the Vanilla JavaScript frontend. Business logic should be centralized in the Worker, while the frontend handles presentation and user interaction.
- **Maintainability:** Prioritize code readability and structural integrity to allow for easy updates and the integration of new features like ImageKit.io.
