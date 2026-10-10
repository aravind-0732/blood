import { useEffect, useRef, useState } from "react";
import "./App.css";

/* ---------- Constants ---------- */

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_LEVELS = [
  { value: "critical", label: "Critical", hint: "Within hours" },
  { value: "urgent", label: "Urgent", hint: "Within 24 hours" },
  { value: "planned", label: "Planned", hint: "Within a week" },
];

const PAGE_SIZE = 12;

// dummyJSON user records include a bloodGroup field, so they work as mock donors.
const DONORS_URL =
  "https://dummyjson.com/users?limit=100&select=firstName,lastName,age,bloodGroup,phone,address";

// JSONPlaceholder accepts POSTs and replies with a fake id (nothing is stored).
const REQUESTS_URL = "https://jsonplaceholder.typicode.com/posts";

const EMPTY_FORM = {
  name: "",
  contact: "",
  group: "",
  urgency: "urgent",
  location: "",
};

/* ---------- Helpers ---------- */

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter the patient or hospital name.";

  const contact = values.contact.trim();
  const looksLikeEmail = /^\S+@\S+\.\S+$/.test(contact);
  const looksLikePhone = contact.replace(/\D/g, "").length >= 7;
  if (!contact) errors.contact = "Enter a phone number or email address.";
  else if (!looksLikeEmail && !looksLikePhone)
    errors.contact = "Enter a valid phone number or email address.";

  if (!values.group) errors.group = "Choose the blood group needed.";
  if (!values.location.trim()) errors.location = "Enter a city or hospital location.";
  return errors;
}

/* ---------- Small components ---------- */

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M16 2.5c-4.6 6-9 10.7-9 16a9 9 0 0 0 18 0c0-5.3-4.4-10-9-16Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DonorCard({ donor, onRequest }) {
  return (
    <li className="donor-card">
      <div className="drop" aria-hidden="true">
        <span>{donor.bloodGroup}</span>
      </div>
      <div className="donor-info">
        <h3>{donor.name}</h3>
        <p className="donor-meta">
          <span className="sr-only">Blood group {donor.bloodGroup}. </span>
          {donor.city}, {donor.state} &middot; Age {donor.age}
        </p>
        <div className="donor-actions">
          <a className="link-btn" href={`tel:${donor.phone.replace(/[^\d+]/g, "")}`}>
            Call {donor.phone}
          </a>
          <button
            type="button"
            className="text-btn"
            onClick={() => onRequest(donor.bloodGroup)}
          >
            Request {donor.bloodGroup} blood
          </button>
        </div>
      </div>
    </li>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Section A: Find donors ---------- */

function FindDonors({ donors, loading, error, onRetry, onRequest }) {
  const [filters, setFilters] = useState({ group: "", location: "" });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = filters.location.trim().toLowerCase();
  const filtered = donors.filter(
    (d) =>
      (!filters.group || d.bloodGroup === filters.group) &&
      (!query || `${d.city} ${d.state}`.toLowerCase().includes(query))
  );
  const shown = filtered.slice(0, visible);
  const hasFilters = filters.group || filters.location;

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setVisible(PAGE_SIZE);
  }

  return (
    <section aria-labelledby="find-heading">
      <h2 id="find-heading">Find a donor</h2>
      <p className="section-lead">
        Filter registered donors by blood group and city or state.
      </p>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="filter-group">Blood group</label>
          <select
            id="filter-group"
            value={filters.group}
            onChange={(e) => updateFilter("group", e.target.value)}
          >
            <option value="">All groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-location">Location</label>
          <input
            id="filter-location"
            type="search"
            placeholder="City or state"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="secondary-btn"
          disabled={!hasFilters}
          onClick={() => {
            setFilters({ group: "", location: "" });
            setVisible(PAGE_SIZE);
          }}
        >
          Clear filters
        </button>
      </form>

      <div aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="state-box" role="status">
            <span className="spinner" aria-hidden="true" />
            <p>Loading donors&hellip;</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-box state-error" role="alert">
            <p>We couldn&rsquo;t load donors. {error}</p>
            <button type="button" className="primary-btn" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="result-count">
              {filtered.length === 0
                ? "No donors match these filters."
                : `Showing ${shown.length} of ${filtered.length} donor${
                    filtered.length === 1 ? "" : "s"
                  }`}
            </p>

            {filtered.length === 0 && (
              <div className="state-box">
                <p>Try a different blood group, or search by state instead of city.</p>
              </div>
            )}

            <ul className="donor-grid">
              {shown.map((d) => (
                <DonorCard key={d.id} donor={d} onRequest={onRequest} />
              ))}
            </ul>

            {shown.length < filtered.length && (
              <div className="more-row">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Show more donors
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- Section B: Request blood ---------- */

function RequestForm({ prefill }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [requestId, setRequestId] = useState(null);
  const formRef = useRef(null);
  const successRef = useRef(null);

  // When a donor card's "Request" button is used, pre-select that blood group.
  useEffect(() => {
    if (prefill.group) {
      setValues((prev) => ({ ...prev, group: prefill.group }));
      setErrors((prev) => ({ ...prev, group: undefined }));
      setStatus((s) => (s === "success" ? "idle" : s));
    }
  }, [prefill]);

  // Move focus to the confirmation so screen reader users hear it.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch(REQUESTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          title: `Blood request: ${values.group} (${values.urgency})`,
          body: JSON.stringify(values),
          userId: 1,
        }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      setRequestId(json.id);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function startOver() {
    setValues(EMPTY_FORM);
    setErrors({});
    setRequestId(null);
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <section aria-labelledby="request-heading">
        <h2 id="request-heading">Request blood</h2>
        <div className="success-box" role="status" tabIndex={-1} ref={successRef}>
          <h3>Request sent</h3>
          <p>
            Your request for <strong>{values.group}</strong> blood in{" "}
            <strong>{values.location}</strong> has been submitted. Donors and
            coordinators will reach you at <strong>{values.contact}</strong>.
          </p>
          {requestId && <p className="muted">Reference number: #{requestId}</p>}
          <button type="button" className="primary-btn" onClick={startOver}>
            Submit another request
          </button>
        </div>
      </section>
    );
  }

  const submitting = status === "submitting";

  return (
    <section aria-labelledby="request-heading">
      <h2 id="request-heading">Request blood</h2>
      <p className="section-lead">
        Patients and hospitals can post a request. Fields marked with * are required.
      </p>

      <form className="request-form" onSubmit={handleSubmit} noValidate ref={formRef}>
        <Field id="name" label="Patient or hospital name *" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

        <Field id="contact" label="Phone or email *" error={errors.contact}>
          <input
            id="contact"
            name="contact"
            type="text"
            inputMode="email"
            autoComplete="email"
            value={values.contact}
            onChange={(e) => setField("contact", e.target.value)}
            aria-invalid={Boolean(errors.contact)}
            aria-describedby={errors.contact ? "contact-error" : undefined}
          />
        </Field>

        <Field id="group" label="Blood group needed *" error={errors.group}>
          <select
            id="group"
            name="group"
            value={values.group}
            onChange={(e) => setField("group", e.target.value)}
            aria-invalid={Boolean(errors.group)}
            aria-describedby={errors.group ? "group-error" : undefined}
          >
            <option value="">Select a group</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field id="location" label="Location *" error={errors.location}>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Hospital name, city or state"
            value={values.location}
            onChange={(e) => setField("location", e.target.value)}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? "location-error" : undefined}
          />
        </Field>

        <fieldset className="urgency">
          <legend>How urgent is it?</legend>
          <div className="urgency-options">
            {URGENCY_LEVELS.map((u) => (
              <label key={u.value} className="urgency-option">
                <input
                  type="radio"
                  name="urgency"
                  value={u.value}
                  checked={values.urgency === u.value}
                  onChange={(e) => setField("urgency", e.target.value)}
                />
                <span className="urgency-label">
                  <strong>{u.label}</strong>
                  <small>{u.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {status === "error" && (
          <p className="form-error" role="alert">
            We couldn&rsquo;t send your request. Check your connection and try again.
          </p>
        )}

        <button type="submit" className="primary-btn wide" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner small" aria-hidden="true" /> Sending request&hellip;
            </>
          ) : (
            "Send blood request"
          )}
        </button>
      </form>
    </section>
  );
}

/* ---------- App ---------- */

const TABS = [
  { id: "find", label: "Find donors" },
  { id: "request", label: "Request blood" },
];

export default function App() {
  const [tab, setTab] = useState("find");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [prefill, setPrefill] = useState({ group: "", n: 0 });
  const tabRefs = useRef({});

  // Fetch the donor list from the public API (re-runs when "Try again" is pressed).
  useEffect(() => {
    const controller = new AbortController();

    async function loadDonors() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(DONORS_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Server responded with ${res.status}.`);
        const json = await res.json();
        setDonors(
          json.users.map((u) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            age: u.age,
            bloodGroup: u.bloodGroup,
            phone: u.phone,
            city: u.address.city,
            state: u.address.state,
          }))
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Please check your connection.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDonors();
    return () => controller.abort();
  }, [reloadKey]);

  function handleTabKeyDown(e) {
    const index = TABS.findIndex((t) => t.id === tab);
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const nextId = TABS[next].id;
    setTab(nextId);
    tabRefs.current[nextId]?.focus();
  }

  function requestFromDonor(group) {
    setPrefill((p) => ({ group, n: p.n + 1 }));
    setTab("request");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Logo />
            <div>
              <h1>RedDrop</h1>
              <p>Blood donor search and request portal</p>
            </div>
          </div>

          <div className="tabs" role="tablist" aria-label="Portal sections" onKeyDown={handleTabKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                ref={(el) => (tabRefs.current[t.id] = el)}
                className={tab === t.id ? "tab active" : "tab"}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main id="main" className="container main">
        <div
          id="panel-find"
          role="tabpanel"
          aria-labelledby="tab-find"
          hidden={tab !== "find"}
        >
          <FindDonors
            donors={donors}
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((k) => k + 1)}
            onRequest={requestFromDonor}
          />
        </div>

        {/* Kept mounted (just hidden) so typed form values survive tab switches. */}
        <div
          id="panel-request"
          role="tabpanel"
          aria-labelledby="tab-request"
          hidden={tab !== "request"}
        >
          <RequestForm prefill={prefill} />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Demo only. Donor data comes from a public mock API and requests are not
            stored. In an emergency, call your local emergency number.
          </p>
        </div>
      </footer>
    </div>
  );
}