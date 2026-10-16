"use client";

import ReactMarkdown from "react-markdown";
import { engineDefinition } from "@/lib/coveo-engine";
import styles from "./search-experience.module.css";

export default function GeneratedAnswer() {
  const { state, methods } = engineDefinition.controllers.useGeneratedAnswer();
  const isGenerating = state.isLoading || state.isStreaming;

  if (!state.isVisible || state.cannotAnswer) return null;
  if (!isGenerating && !state.answer && !state.error) return null;

  return (
    <section className={styles.generatedAnswer} aria-label="Generated answer" aria-busy={isGenerating}>
      <div className={styles.generatedAnswerHeading}>
        <h2>Generated answer</h2>
        {isGenerating && <span className={styles.generatedAnswerStatus}>Generating…</span>}
      </div>

      {state.error ? (
        <p className={styles.generatedAnswerError}>
          The answer could not be generated.{" "}
          <button className={styles.inlineTextButton} type="button" onClick={() => methods?.retry()}>
            Try again
          </button>
        </p>
      ) : state.answerContentFormat === "text/markdown" ? (
        <div className={styles.generatedAnswerBody}>
          <ReactMarkdown>{state.answer ?? ""}</ReactMarkdown>
        </div>
      ) : (
        <p className={`${styles.generatedAnswerBody} ${styles.generatedAnswerPlain}`}>{state.answer}</p>
      )}

      {state.citations.length > 0 && (
        <div className={styles.citations}>
          <h3>Sources</h3>
          <ol>
            {state.citations.map((citation) => (
              <li key={citation.id}>
                <a
                  href={citation.clickUri ?? citation.uri}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => methods?.logCitationClick(citation.id)}
                >
                  {citation.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!isGenerating && state.answer && (
        <div className={styles.answerFeedback} role="group" aria-label="Was this answer helpful?">
          <span>Helpful?</span>
          <button type="button" aria-pressed={state.liked} onClick={() => methods?.like()}>
            Yes
          </button>
          <button type="button" aria-pressed={state.disliked} onClick={() => methods?.dislike()}>
            No
          </button>
        </div>
      )}
    </section>
  );
}
