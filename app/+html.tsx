import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* Primary Meta Tags */}
        <title>Gambit - The Ultimate Party Game App | 150+ Prompts, 8 Categories</title>
        <meta name="title" content="Gambit - The Ultimate Party Game App | 150+ Prompts, 8 Categories" />
        <meta name="description" content="Gambit is the #1 party game app with 150+ curated prompts across 8 categories. Drinking games, dares, confessions & more. Download free for iOS and Android." />
        <meta name="keywords" content="party game app, drinking game app, party games, truth or dare app, gambit, social games, group games, party app, friends game, best party game" />
        <meta name="author" content="Maxwell Young" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content="Gambit" />
        <meta name="apple-mobile-web-app-title" content="Gambit" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playgambit.app/" />
        <meta property="og:title" content="Gambit - The Ultimate Party Game App" />
        <meta property="og:description" content="150+ curated prompts across 8 categories. Drinking games, dares, confessions & more. The #1 party game for unforgettable nights." />
        <meta property="og:image" content="https://playgambit.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Gambit - Party Chaos, Perfected" />
        <meta property="og:site_name" content="Gambit" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://playgambit.app/" />
        <meta name="twitter:title" content="Gambit - The Ultimate Party Game App" />
        <meta name="twitter:description" content="150+ curated prompts across 8 categories. The #1 party game for unforgettable nights with friends." />
        <meta name="twitter:image" content="https://playgambit.app/og-image.png" />
        <meta name="twitter:creator" content="@maxwellyoung_" />

        {/* App Store Smart Banner */}
        <meta name="apple-itunes-app" content="app-id=6737107968" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://playgambit.app/" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/icon.png" />
        <link rel="mask-icon" href="/assets/images/icon.png" color="#8B5CF6" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://apps.apple.com" />
        <link rel="dns-prefetch" href="https://play.google.com" />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Gambit",
              "alternateName": "Gambit Party Game",
              "url": "https://playgambit.app/",
              "description": "The ultimate party game app with 150+ curated prompts across 8 categories.",
              "publisher": {
                "@type": "Person",
                "name": "Maxwell Young",
                "url": "https://maxwellyoung.info"
              }
            })
          }}
        />

        {/* Structured Data - MobileApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MobileApplication",
              "name": "Gambit",
              "operatingSystem": "iOS, Android",
              "applicationCategory": "GameApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "100",
                "bestRating": "5",
                "worstRating": "1"
              },
              "description": "The #1 party game app with 150+ curated prompts across 8 categories including drinking games, dares, confessions, hot takes, and more.",
              "screenshot": "https://playgambit.app/screenshot.png",
              "featureList": "150+ Prompts, 8 Categories, 10 Chaos Levels, Spicy Mode, Timed Challenges, Zero Ads",
              "softwareVersion": "1.0.5",
              "author": {
                "@type": "Person",
                "name": "Maxwell Young"
              },
              "downloadUrl": [
                "https://apps.apple.com/app/id6737107968",
                "https://play.google.com/store/apps/details?id=com.maxwellyoung.socialchaos"
              ]
            })
          }}
        />

        {/* Structured Data - FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Gambit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Gambit is a party game app with 150+ curated prompts across 8 categories including drinking games, dares, confessions, hot takes, physical challenges, social games, creative prompts, and chaos mode."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is Gambit free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Gambit is completely free to download and play. There are no ads and no in-app purchases required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How many players can play Gambit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Gambit works best with 2 or more players. There's no upper limit - the more the merrier for party games!"
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are chaos levels in Gambit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Chaos levels range from 1-10 and control the intensity of prompts. Level 1 is chill and wholesome, while level 10 is absolute mayhem with the wildest challenges."
                  }
                }
              ]
            })
          }}
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: #050505;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  text-rendering: optimizeLegibility;
}

/* Smooth scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* Selection color */
::selection {
  background: rgba(139, 92, 246, 0.4);
  color: #fff;
}

::-moz-selection {
  background: rgba(139, 92, 246, 0.4);
  color: #fff;
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  html {
    scroll-behavior: auto;
  }
}

/* Better touch targets on mobile */
@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Print styles */
@media print {
  body {
    background: white;
    color: black;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  body {
    background: black;
  }
}
`;
