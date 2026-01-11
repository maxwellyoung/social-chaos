import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary Meta Tags */}
        <title>Gambit - Party Chaos, Perfected</title>
        <meta name="title" content="Gambit - Party Chaos, Perfected" />
        <meta name="description" content="150+ prompts, 8 categories, infinite memories. The ultimate party game app for unforgettable nights with friends." />
        <meta name="keywords" content="party game, drinking game, party app, gambit, social game, friends game" />
        <meta name="author" content="Maxwell Young" />
        <meta name="theme-color" content="#0A0A0A" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Gambit - Party Chaos, Perfected" />
        <meta property="og:description" content="150+ prompts, 8 categories, infinite memories. The ultimate party game for unforgettable nights." />
        <meta property="og:site_name" content="Gambit" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Gambit - Party Chaos, Perfected" />
        <meta property="twitter:description" content="150+ prompts, 8 categories, infinite memories. The ultimate party game for unforgettable nights." />

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/assets/images/icon.png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
* {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: #0A0A0A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Hide scrollbar but allow scrolling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Selection color */
::selection {
  background: rgba(139, 92, 246, 0.3);
  color: #fff;
}
`;
