"use client";

import { useEffect, useMemo, useState } from "react";
import { Press_Start_2P, VT323 } from "next/font/google";

const pixelTitle = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelBody = VT323({
  weight: "400",
  subsets: ["latin"],
});

const STORAGE_KEY = "study-phone-messages";

type PhoneMessage = {
  id: string;
  from: string;
  text: string;
  createdAt: number;
};

const SAMPLE_MESSAGE: PhoneMessage = {
  id: "sample-d",
  from: "D.\u2764",
  text: "If you're going to be free tmr, let's grab some drinks.",
  createdAt: new Date("2004-06-18T21:38:00").getTime(),
};

type PhoneView = "compose" | "read" | "inbox";

function loadMessages(): PhoneMessage[] {
  if (typeof window === "undefined") return [SAMPLE_MESSAGE];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [SAMPLE_MESSAGE];
    const parsed = JSON.parse(raw) as PhoneMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [SAMPLE_MESSAGE];
    return parsed;
  } catch {
    return [SAMPLE_MESSAGE];
  }
}

function saveMessages(messages: PhoneMessage[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function formatPhoneDate(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  let hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${year}.${month}.${day}. ${hours}:${minutes}${suffix}`;
}

export function PhoneGuestbook() {
  const [messages, setMessages] = useState<PhoneMessage[]>([SAMPLE_MESSAGE]);
  const [view, setView] = useState<PhoneView>("compose");
  const [index, setIndex] = useState(0);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftText, setDraftText] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  const current = messages[index] ?? messages[0];
  const title = view === "compose" ? "Write Text" : view === "inbox" ? "Inbox" : "Read Text";
  const canSend = draftText.trim().length > 0;
  const newestFirst = useMemo(
    () => [...messages].sort((a, b) => b.createdAt - a.createdAt),
    [messages],
  );

  function showMessage(id: string) {
    const nextIndex = messages.findIndex((item) => item.id === id);
    setIndex(nextIndex >= 0 ? nextIndex : 0);
    setView("read");
  }

  function stepMessage(direction: -1 | 1) {
    if (messages.length === 0) return;
    setView("read");
    setIndex((currentIndex) => {
      const next = currentIndex + direction;
      if (next < 0) return messages.length - 1;
      if (next >= messages.length) return 0;
      return next;
    });
  }

  function requestSend() {
    if (!canSend) return;
    setConfirming(true);
  }

  function confirmSend() {
    const nextMessage: PhoneMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: draftFrom.trim() || "Guest",
      text: draftText.trim(),
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setDraftFrom("");
    setDraftText("");
    setConfirming(false);
    setIndex(nextMessages.length - 1);
    setView("read");
  }

  return (
    <div className={`phone-os ${pixelBody.className}`}>
      <div className="phone-os-status">
        <span className="phone-os-signal" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>89%</span>
        <span className="phone-os-heart" aria-hidden="true">
          ♥
        </span>
      </div>

      <div className="phone-os-header">
        <button
          type="button"
          aria-label="Previous message"
          onClick={() => stepMessage(-1)}
        >
          ◀
        </button>
        <strong className={pixelTitle.className}>{title}</strong>
        <button
          type="button"
          aria-label="Next message"
          onClick={() => stepMessage(1)}
        >
          ▶
        </button>
      </div>

      <div className="phone-os-body">
        {view === "inbox" ? (
          <ul className="phone-os-inbox">
            {newestFirst.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => showMessage(item.id)}>
                  <span>{item.from}</span>
                  <small>{formatPhoneDate(item.createdAt)}</small>
                  <p>{item.text}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : view === "read" && current ? (
          <>
            <div className="phone-os-meta">
              <span aria-hidden="true">✉</span>
              <time>{formatPhoneDate(current.createdAt)}</time>
            </div>
            <div className="phone-os-paper">{current.text}</div>
            <div className="phone-os-from-label">
              <span aria-hidden="true">📱</span>
              From
            </div>
            <div className="phone-os-from">{current.from}</div>
          </>
        ) : (
          <>
            <div className="phone-os-meta">
              <span aria-hidden="true">✉</span>
              <time>{formatPhoneDate(Date.now())}</time>
            </div>
            <label className="phone-os-sr" htmlFor="phone-message">
              Message
            </label>
            <textarea
              id="phone-message"
              className="phone-os-paper phone-os-input"
              maxLength={220}
              placeholder="Leave a note..."
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
            <label className="phone-os-from-label" htmlFor="phone-from">
              <span aria-hidden="true">📱</span>
              From
            </label>
            <input
              id="phone-from"
              className="phone-os-from phone-os-input"
              maxLength={24}
              placeholder="Your name"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
            />
          </>
        )}

        {confirming && (
          <div className="phone-os-confirm" role="dialog" aria-label="Send message">
            <div className="phone-os-confirm-card">
              <header>
                <span>i</span>
                Message
              </header>
              <div className="phone-os-envelope" aria-hidden="true">
                <em />
              </div>
              <p>Send this text?</p>
              <div className="phone-os-confirm-actions">
                <button type="button" onClick={confirmSend}>
                  Yes
                </button>
                <button type="button" onClick={() => setConfirming(false)}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="phone-os-footer">
        <button type="button" onClick={() => setView(view === "inbox" ? "compose" : "inbox")}>
          Menu
        </button>
        <button
          type="button"
          disabled={view === "compose" ? !canSend : false}
          onClick={() => {
            if (view === "compose") {
              requestSend();
              return;
            }
            setView("compose");
            setConfirming(false);
          }}
        >
          {view === "compose" ? "Send" : "Reply"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirming) {
              setConfirming(false);
              return;
            }
            if (view !== "compose") {
              setView("compose");
            }
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
