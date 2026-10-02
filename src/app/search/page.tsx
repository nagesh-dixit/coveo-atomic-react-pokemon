"use client";

import Script from "next/script";
import styles from "./page.module.css";

declare global {
  interface Window {
    CoveoSearchPage: {
      initialize: (interfaceId: string) => void;
    };
  }
}

const apiKey = "xxc9f5f3ff-de5f-4980-b93e-91a0de2ab8b5";

export default function SearchPage() {
  return (
    <main className={styles.page}>
      <h1>Search</h1>
      <Script
        src="https://search.cloud.coveo.com/rest/organizations/pokemonchallengenageshdixithzir1q1q/searchpage/v1/interfaces/ab95d3bf-534d-473f-b6f5-28dab34ca3c9/loader"
        strategy="afterInteractive"
        onReady={() => window.CoveoSearchPage.initialize(apiKey)}
      />
    </main>
  );
}