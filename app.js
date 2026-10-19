"use strict";

(() => {
  const T = window.TRIP;
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHECK_KEY = "india2026.checks.v1";
  const PRIVATE_KEY = "india2026.private.v1";
  let privateData = null;
  let checks = {};

  function notify(message) {
    $("#notice").textContent = message;
    $("#notice").hidden = false;
  }
  if (!T || T.schemaVersion !== 1) {
    notify("Die Reisedaten konnten nicht geladen werden. Bitte data.js zusammen mit index.html hochladen und die Seite erneut öffnen.");
    return;
  }
  const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  const dayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long", timeZone: "UTC" });
  const shortDate = (date) => dateFormat.format(new Date(`${date}T12:00:00Z`));
  const weekday = (date) => dayFormat.format(new Date(`${date}T12:00:00Z`));
  function indiaDate() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (type) => parts.find((p) => p.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }
  const dateTime = (value, zone) => new Intl.DateTimeFormat("de-DE", { timeZone: zone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  const timeOnly = (value, zone) => new Intl.DateTimeFormat("de-DE", { timeZone: zone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  const localDate = (value) => value.slice(0, 10);
  function link(url, label) {
    if (!/^https:\/\//.test(url)) return "";
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  }
  const mapLink = (query, label = "In Karte suchen") => query ? link(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, label) : "";
  const source = (id) => {
    const s = T.sources.find((item) => item.id === id);
    return s ? esc(s.title) : "Quelle offen";
  };
  const badge = (label, warning = false) => `<span class="badge${warning ? " warning" : ""}">${esc(label)}</span>`;
  const stayForDay = (date) => T.stays.find((stay) => stay.start <= date && stay.end > date);
  const guideFor = (id) => T.guides.find((guide) => guide.id === id);
  const dayFor = (date) => T.days.find((day) => day[0] === date);
  let selectedDate = indiaDate();
  if (!dayFor(selectedDate)) selectedDate = T.start;

  function readStored(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      notify(`Lokale Daten konnten nicht gelesen werden (${error.name}). Browser-Speicher freigeben oder beschädigte Daten in den Website-Einstellungen löschen. Es wurden keine Daten ersetzt.`);
      return null;
    }
  }
  function saveStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      notify(`Speichern auf diesem Gerät fehlgeschlagen (${error.name}). Speicherberechtigung oder freien Platz prüfen. Die Änderung ist nicht dauerhaft gespeichert.`);
      return false;
    }
  }
  const storedChecks = readStored(CHECK_KEY);
  if (storedChecks) {
    if (typeof storedChecks === "object" && !Array.isArray(storedChecks) && Object.values(storedChecks).every((value) => typeof value === "boolean")) {
      checks = Object.assign(Object.create(null), storedChecks);
    } else {
      notify("Die gespeicherte Checkliste hat ein ungültiges Format. Häkchen können neu gesetzt werden; vorhandene Daten wurden noch nicht überschrieben.");
    }
  }

  function validatePrivate(input) {
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const text = (value, label, max = 800) => {
      assert(typeof value === "string" && value.length <= max, `${label}: Text fehlt oder ist zu lang.`);
      return value;
    };
    assert(input && typeof input === "object" && !Array.isArray(input), "Die Datei muss ein JSON-Objekt enthalten.");
    assert(input.schemaVersion === 1 && input.tripId === "india-2026", "Die Datei gehört nicht zu dieser Reise oder hat eine unbekannte Version.");
    assert(Array.isArray(input.travelers) && input.travelers.length <= 20, "Reisendenliste fehlt oder ist zu groß.");
    assert(Array.isArray(input.bookings) && input.bookings.length <= 30, "Buchungsliste fehlt oder ist zu groß.");
    const travelers = input.travelers.map((traveler) => text(traveler, "Name", 150));
    const bookings = input.bookings.map((booking) => {
      assert(booking && typeof booking === "object" && !Array.isArray(booking), "Ungültiger Buchungseintrag.");
      assert(T.journeys.some((journey) => journey.id === booking.journey), "Unbekannte Flugreise in der Privatdatei.");
      assert(Array.isArray(booking.details) && booking.details.length <= 30, "Buchungsdetails fehlen oder sind zu groß.");
      return {
        journey: booking.journey,
        title: text(booking.title, "Buchungstitel", 150),
        details: booking.details.map((detail) => {
          assert(Array.isArray(detail) && detail.length === 2, "Buchungsdetails müssen aus Bezeichnung und Wert bestehen.");
          return [text(detail[0], "Bezeichnung", 150), text(detail[1], "Wert", 1200)];
        })
      };
    });
    assert(Array.isArray(input.notes) && input.notes.length <= 30, "Notizliste fehlt oder ist zu groß.");
    return { schemaVersion: 1, tripId: "india-2026", travelers, bookings, notes: input.notes.map((note) => text(note, "Notiz", 1500)) };
  }
  let storedPrivate = readStored(PRIVATE_KEY);
  if (storedPrivate) {
    try { privateData = validatePrivate(storedPrivate); }
    catch (error) { notify(`Gespeicherte Privatdaten nicht geladen: ${error.message} Bitte eine gültige Datei erneut importieren oder lokale Privatdaten löschen.`); }
  }

  function showView(id, focus = false) {
    const allowed = ["heute", "route", "karte", "hotels", "fluege", "guide", "organisation", "privat"];
    const active = allowed.includes(id) ? id : "heute";
    document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== active; });
    document.querySelectorAll(".navigation a, .more-menu a").forEach((anchor) => {
      if (anchor.hash === `#${active}`) anchor.setAttribute("aria-current", "page");
      else anchor.removeAttribute("aria-current");
    });
    $("#nav-more").classList.toggle("is-active", active === "organisation" || active === "privat");
    closeMore();
    if (active === "heute") renderDay();
    if (focus) $("#main").focus({ preventScroll: true });
  }
  function closeMore() {
    $("#more-menu").hidden = true;
    $("#nav-more").setAttribute("aria-expanded", "false");
  }
  let pendingReveal = null;
  function revealHotel(id) {
    const row = document.getElementById(`stay-${id}`);
    if (row) row.scrollIntoView({ block: "start" });
  }
  function navigate(id) {
    if (location.hash === `#${id}`) showView(id, true);
    else location.hash = id;
  }
  window.addEventListener("hashchange", () => {
    if (location.hash === "#main") return;
    showView(location.hash.slice(1), true);
    if (pendingReveal) { pendingReveal(); pendingReveal = null; }
    else window.scrollTo({ top: 0, behavior: "instant" });
  });
  $("#nav-more").addEventListener("click", (event) => {
    const open = $("#more-menu").hidden;
    $("#more-menu").hidden = !open;
    $("#nav-more").setAttribute("aria-expanded", String(open));
    if (open && event.detail === 0) $("#more-menu a").focus();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest(".more-menu a, .more-menu button") || (!$("#more-menu").hidden && !event.target.closest("#more-menu, #nav-more"))) closeMore();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#more-menu").hidden) { closeMore(); $("#nav-more").focus(); }
  });

  function flightArrival(flight) {
    return flight.arrival
      ? dateTime(flight.arrival, flight.toZone)
      : `${flight.arrivalCandidates.map((candidate) => timeOnly(candidate, flight.toZone)).join(" / ")} Uhr am ${shortDate(localDate(flight.arrivalCandidates[0]))} – ungeklärt`;
  }
  function renderDay() {
    const day = dayFor(selectedDate);
    const [date, title, place, type, fixed, suggestion, important] = day;
    const stay = stayForDay(date);
    const guide = guideFor(place);
    const transfers = T.transfers.filter((transfer) => transfer.date === date);
    const dayFlights = T.flights.filter((flight) => localDate(flight.departure) === date);
    const upcoming = T.flights.find((flight) => new Date(flight.departure) >= new Date(`${date}T00:00:00+05:30`));
    const next = dayFlights.length ? dayFlights : (upcoming ? [upcoming] : []);
    $("#travel-date").value = date;
    const index = T.days.indexOf(day);
    $("#day-position").textContent = `Tag ${index + 1} von ${T.days.length}`;
    $("#previous-day").disabled = index === 0;
    $("#next-day").disabled = index === T.days.length - 1;
    const actualToday = indiaDate();
    $("#trip-context").textContent = actualToday < T.start ? "Vorfreude-Modus: Wählt euren Reisetag und schaut voraus."
      : actualToday > T.end ? "Die Reise ist zu Ende. Hier bleibt euer vollständiger Reiseplan."
        : `Heute in Indien: ${shortDate(actualToday)}. Der ausgewählte Tag lässt sich jederzeit ändern.`;
    $("#jump-today").disabled = actualToday < T.start || actualToday > T.end;
    const overnight = stay ? `<strong>${esc(stay.name)}</strong><span>${esc(stay.area)}</span><span>${badge("Gebucht")} ${stay.nights} Nacht${stay.nights === 1 ? "" : "e"} · bis ${shortDate(stay.end)}</span>`
      : date === T.start ? "<strong>Nacht an Bord</strong><span>Ankunft in Goa am 4. Dezember</span>" : "<strong>Heimreise</strong><span>Flugziel Frankfurt, danach weiter nach Stuttgart</span>";
    $("#day-content").innerHTML = `
      <div class="day-layout">
        <article class="day-sheet"><span class="day-arc" aria-hidden="true"></span><div class="date-line">${esc(weekday(date))}, ${shortDate(date)}</div><h2>${esc(title)}</h2>${badge(type)}<p class="day-summary">${esc(fixed)}</p><div class="overnight">${overnight}${stay ? `<div class="inline-links"><button class="secondary on-dark" type="button" data-hotel="${esc(stay.id)}">Unterkunft ansehen</button></div>` : ""}</div></article>
        <section class="next-steps" aria-labelledby="next-title"><h2 id="next-title">Das ist jetzt wichtig</h2><div class="action-row"><p>${esc(important)}</p></div>
        ${next.map((flight) => `<div class="action-row"><p class="meta">${dayFlights.length ? "Flug an diesem Tag" : "Nächster Flug"} · ${esc(flight.number)}</p><h3>${esc(flight.fromName)} → ${esc(flight.toName)}</h3><p>${esc(dateTime(flight.departure, flight.fromZone))} Uhr · Abflug-Ortszeit</p><a href="#fluege">Flugdetails öffnen</a></div>`).join("")}
        ${transfers.map((transfer) => `<div class="action-row"><p class="meta">Transfer organisiert · Details teils offen</p><h3>${esc(transfer.title)}</h3>${transfer.duration ? `<p>${esc(transfer.duration)}</p>` : ""}<p class="meta">${esc(transfer.note)}</p></div>`).join("")}
        ${!next.length && !transfers.length ? '<div class="action-row"><p>Kein weiterer Flug oder Transfer für diesen Tag dokumentiert.</p></div>' : ""}
        </section>
      </div>
      <div class="day-extra"><section><h2>Wenn ihr Lust habt</h2>${badge("Nicht zusätzlich gebucht")}<p>${esc(suggestion)}</p>${guide ? `<button type="button" class="secondary" data-guide="${esc(guide.id)}">Guide für ${esc(guide.title)}</button>` : ""}</section><section><h2>Gut zu wissen</h2><p>${stay ? esc(stay.note) : "Dokumente und Medikamente griffbereit halten. Die hier angezeigten Zeiten stammen aus Buchungsunterlagen und sind kein Live-Status."}</p><p class="meta">Route: Excel und bestätigte Aufenthaltsdaten. Aktivitäten: flexible Vorschläge.</p></section></div>`;
  }

  function renderRoute() {
    $("#route-content").innerHTML = T.days.map(([date, title, , type, fixed]) => {
      const stay = stayForDay(date);
      return `<article class="route-day"><time datetime="${date}">${shortDate(date).slice(0, 6)}<span>${esc(weekday(date))}</span></time><div><h3>${esc(title)} ${badge(type)}</h3><p>${esc(fixed)}</p><p class="meta">${stay ? `Übernachtung: ${esc(stay.name)}` : date === T.start ? "Nacht an Bord" : "Heimreise"}</p></div><button type="button" class="open-day" data-day="${date}" aria-label="Tagesplan für ${shortDate(date)} öffnen"><span class="open-label">Tag öffnen</span> →</button></article>`;
    }).join("");
  }
  function renderHotels() {
    $("#hotels-content").innerHTML = T.stays.map((stay) => `<article class="hotel-row" id="stay-${esc(stay.id)}"><div><div class="stay-date">${shortDate(stay.start)}<br> — ${shortDate(stay.end)}</div><p class="meta">${stay.nights} Nacht${stay.nights === 1 ? "" : "e"}</p>${badge("Gebucht")}</div><div><h2>${esc(stay.name)}</h2><p>${esc(stay.area)}</p><p>${esc(stay.note)}</p><p class="hotel-address"><span class="meta">Adresse</span>${stay.address ? esc(stay.address) : "Vollständige Anschrift nicht dokumentiert; Kartenziel vor Fahrt abgleichen."}</p><div class="inline-links hotel-actions">${mapLink(stay.map, "Karte")}${stay.website ? link(stay.website, "Website") : ""}<button type="button" class="secondary" data-guide="${esc(stay.place)}">Ortsguide</button><button type="button" class="secondary" data-map-focus="${esc(stay.id)}">Reisekarte</button></div><details class="hotel-facts"><summary>Buchungsdetails & offene Punkte</summary><dl><dt>Check-in / -out</dt><dd>Individuelle Uhrzeiten fehlen.</dd><dt>Zimmer / Leistungen</dt><dd>Kategorie, Belegung und Verpflegung nicht dokumentiert.</dd><dt>Kontakt / Storno</dt><dd>Buchungsspezifische Angaben fehlen.</dd><dt>Quelle</dt><dd>${source(stay.source)}; Zeitraum durch Reisende bestätigt.</dd></dl></details></div></article>`).join("");
  }
  const MAP_VIEWS = {
    overview: {
      title: "Übersichtskarte Südindien mit allen Stationen", n: 16.1, s: 7.9, w: 73, e: 78.6, k: 100, c: 0.978,
      coast: [[16.1, 73.42], [15.75, 73.68], [15.5, 73.8], [15.4, 73.8], [15.2, 73.92], [15.05, 73.97], [14.9, 74.08], [14.5, 74.35], [14, 74.55], [13.5, 74.7], [13, 74.8], [12.5, 74.97], [12, 75.2], [11.5, 75.6], [11.25, 75.77], [10.8, 75.92], [10.5, 76.05], [10.2, 76.17], [9.97, 76.235], [9.6, 76.29], [9.5, 76.32], [9, 76.47], [8.9, 76.56], [8.5, 76.92], [8.25, 77.25], [8.08, 77.55], [8.3, 77.95], [8.8, 78.15], [9.15, 78.45], [9.25, 78.6]],
      regions: [["Arabisches Meer", 12.1, 73.75], ["Goa", 15.6, 74.35], ["Karnataka", 14.3, 76.1], ["Kerala", 11.05, 76.25], ["Tamil Nadu", 11.1, 77.85]]
    },
    kerala: {
      title: "Detailkarte Kerala mit den Stationen ab Kochi", n: 10.3, s: 9.3, w: 76.1, e: 77.35, k: 380, c: 0.985,
      coast: [[10.3, 76.14], [10.14, 76.18], [9.97, 76.235], [9.8, 76.265], [9.6, 76.29], [9.5, 76.32], [9.3, 76.39]],
      regions: [["Westghats", 9.92, 76.93], ["Backwaters", 9.64, 76.47]]
    }
  };
  const MAP_LEGS = [["air:GOI", "goa"], ["air:GOI", "air:BLR", true], ["air:BLR", "bengaluru"], ["air:BLR", "air:COK", true], ["air:COK", "kochi"], ["kochi", "munnar"], ["munnar", "periyar"], ["periyar", "kyna"], ["kyna", "boat"], ["boat", "marari"], ["marari", "flora"]];
  const stayNumber = (id) => T.stays.findIndex((stay) => stay.id === id) + 1;
  function renderMapView(key) {
    const v = MAP_VIEWS[key];
    const width = (v.e - v.w) * v.k * v.c;
    const height = (v.n - v.s) * v.k;
    const round = (value) => Math.round(value * 10) / 10;
    const pt = ([lat, lon]) => [round((lon - v.w) * v.k * v.c), round((v.n - lat) * v.k)];
    const inside = ([lat, lon]) => lat <= v.n && lat >= v.s && lon >= v.w && lon <= v.e;
    const kerala = MAP_VIEWS.kerala;
    const inKerala = ([lat, lon]) => lat <= kerala.n && lat >= kerala.s && lon >= kerala.w && lon <= kerala.e;
    const coords = (ref) => ref.startsWith("air:") ? T.atlas.airports.find((airport) => airport.code === ref.slice(4)).at : T.atlas.stays[ref].at;
    const land = [...v.coast, [v.coast[v.coast.length - 1][0], v.e], [v.n, v.e]].map(pt).map(([x, y]) => `${x},${y}`).join(" ");
    const curve = (from, to, bend = 0.2) => {
      const [x1, y1] = pt(from); const [x2, y2] = pt(to);
      const cx = round((x1 + x2) / 2 + (y2 - y1) * bend); const cy = round((y1 + y2) / 2 - (x2 - x1) * bend);
      return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
    };
    const fontSize = key === "overview" ? 17 : 15;
    const legs = MAP_LEGS.filter(([a, b]) => inside(coords(a)) && inside(coords(b)))
      .map(([a, b, flight]) => flight ? `<path class="map-flight" d="${curve(coords(a), coords(b))}"/>` : `<path class="map-ground" d="M${pt(coords(a)).join(" ")} L${pt(coords(b)).join(" ")}"/>`).join("");
    const external = key === "overview"
      ? `<path class="map-flight" d="${curve([16.1, 73.55], T.atlas.airports[0].at, -0.25)}"/><text class="map-note" x="66" y="20" font-size="${fontSize - 2}">aus Mumbai (Anreise)</text><path class="map-flight" d="${curve(T.atlas.airports[2].at, [10.95, 73], 0.18)}"/><text class="map-note" x="8" y="${pt([11.15, 73])[1]}" font-size="${fontSize - 2}">nach Kuwait · Frankfurt</text>`
      : "";
    const detailFrame = key === "overview"
      ? (() => { const [x1, y1] = pt([kerala.n, kerala.w]); const [x2, y2] = pt([kerala.s, kerala.e]); return `<rect class="map-frame" x="${x1}" y="${y1}" width="${round(x2 - x1)}" height="${round(y2 - y1)}" rx="4"/><text class="map-note" x="${x2}" y="${round(y2 + fontSize + 4)}" text-anchor="end" font-size="${fontSize - 2}">Kerala-Detail ↓</text>`; })()
      : "";
    const regions = v.regions.map(([label, lat, lon]) => `<text class="map-region" x="${pt([lat, lon])[0]}" y="${pt([lat, lon])[1]}" text-anchor="middle" font-size="${fontSize}">${esc(label)}</text>`).join("");
    const airports = T.atlas.airports.filter((airport) => inside(airport.at)).map((airport) => {
      const [x, y] = pt(airport.at);
      const left = airport.code === "GOI";
      return `<g class="map-airport"><rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="1.5"/><text x="${left ? x - 10 : x + 8}" y="${y - 9}" text-anchor="${left ? "end" : "start"}" font-size="${fontSize - 3}">${esc(airport.code)}</text></g>`;
    }).join("");
    const markers = T.stays.filter((stay) => T.atlas.stays[stay.id] && inside(T.atlas.stays[stay.id].at)).map((stay) => {
      const point = T.atlas.stays[stay.id];
      const [x, y] = pt(point.at);
      const n = stayNumber(stay.id);
      if (key === "overview" && inKerala(point.at)) return `<circle class="map-dot" cx="${x}" cy="${y}" r="4.5"/>`;
      const r = key === "overview" ? 13 : 12.5;
      const lx = point.side === "l" ? x - r - 6 : x + r + 6;
      return `<g class="map-stop" data-map-stay="${esc(stay.id)}" tabindex="0" role="button" aria-label="Station ${n}: ${esc(stay.name)}, ${shortDate(stay.start)} bis ${shortDate(stay.end)}"><circle class="map-hit" cx="${x}" cy="${y}" r="24"/><circle class="map-pin" cx="${x}" cy="${y}" r="${r}"/><text class="map-number" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize - 2}">${n}</text><text class="map-label" x="${lx}" y="${y}" text-anchor="${point.side === "l" ? "end" : "start"}" dominant-baseline="central" font-size="${fontSize}">${esc(point.label)}</text></g>`;
    }).join("");
    $(`#map-${key}`).innerHTML = `<svg viewBox="0 0 ${round(width)} ${round(height)}" role="group" aria-label="${esc(v.title)}"><title>${esc(v.title)}</title><rect class="map-sea" width="${round(width)}" height="${round(height)}"/><polygon class="map-land" points="${land}"/>${regions}${detailFrame}${legs}${external}${airports}${markers}</svg><figcaption>${key === "overview" ? "Gesamtreise: Goa → Bengaluru → Kerala" : "Kerala: Kochi → Munnar → Thekkady → Backwaters → Marari → Flughafen"}</figcaption>`;
  }
  function renderMap() {
    renderMapView("overview");
    renderMapView("kerala");
    $("#station-list").innerHTML = T.stays.map((stay, index) => {
      const point = T.atlas.stays[stay.id] || {};
      return `<li class="station" id="station-${esc(stay.id)}"><span class="station-no" aria-hidden="true">${index + 1}</span><div><p class="meta">${shortDate(stay.start)} – ${shortDate(stay.end)} · ${stay.nights} Nacht${stay.nights === 1 ? "" : "e"}</p><h2>${esc(stay.name)}</h2><p>${esc(stay.area)}</p>${point.open ? `<p class="meta">${esc(point.open)}</p>` : ""}<div class="inline-links station-actions"><button type="button" class="secondary" data-map-focus="${esc(stay.id)}">Auf Karte zeigen</button>${mapLink(stay.map, "Google Maps")}<button type="button" class="secondary" data-hotel="${esc(stay.id)}">Unterkunft</button></div></div></li>`;
    }).join("");
  }
  function selectStation(id, reveal) {
    document.querySelectorAll("[data-map-stay], .station").forEach((element) => {
      element.classList.toggle("is-selected", element.dataset.mapStay === id || element.id === `station-${id}`);
    });
    const smooth = matchMedia("(prefers-reduced-motion: no-preference)").matches ? "smooth" : "instant";
    if (reveal === "list") document.getElementById(`station-${id}`).scrollIntoView({ block: "nearest", behavior: smooth });
    if (reveal === "map") {
      const marker = $(`[data-map-stay="${id}"]`);
      if (marker) marker.closest("figure").scrollIntoView({ block: "start", behavior: smooth });
    }
  }
  $("#karte").addEventListener("click", (event) => {
    const marker = event.target.closest("[data-map-stay]");
    if (marker) selectStation(marker.dataset.mapStay, "list");
  });
  $("#karte").addEventListener("keydown", (event) => {
    const marker = event.target.closest("[data-map-stay]");
    if (marker && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectStation(marker.dataset.mapStay, "list"); }
  });
  function renderFlights() {
    $("#flights-content").innerHTML = T.journeys.map((journey) => `<section class="flight-group"><h2>${esc(journey.title)}</h2><p>${esc(journey.note)}</p>${T.flights.filter((flight) => flight.journey === journey.id).map((flight) => `<article class="flight"><div class="flight-header"><h3>${esc(flight.number)} · ${esc(flight.airline)}</h3><span class="meta">Buchungsunterlagen · kein Live-Status</span></div><div class="flight-path"><div><span class="airport-code">${esc(flight.from)}</span><div>${esc(flight.fromName)}</div><span class="flight-time">${esc(timeOnly(flight.departure, flight.fromZone))} Uhr</span><span class="meta">${shortDate(localDate(flight.departure))}<br>${esc(flight.fromZone)}</span></div><div class="flight-middle">${flight.arrival ? duration(flight) : "Ankunft offen"}</div><div><span class="airport-code">${esc(flight.to)}</span><div>${esc(flight.toName)}</div><span class="flight-time">${flight.arrival ? `${esc(timeOnly(flight.arrival, flight.toZone))} Uhr` : "09:15 / 09:40?"}</span><span class="meta">${shortDate(localDate(flight.arrival || flight.arrivalCandidates[0]))}<br>${esc(flight.toZone)}</span></div></div><div class="flight-details"><div>Abflugterminal: ${flight.fromTerminal ? esc(flight.fromTerminal) + " laut Beleg" : "nicht angegeben"}</div><div>Ankunftsterminal: ${flight.toTerminal ? esc(flight.toTerminal) + " laut Beleg" : "nicht angegeben"}</div><div>${esc(flight.baggage)}</div><div>${flight.arrival ? "Dauer aus den Ortszeiten berechnet." : badge("Ankunftszeit ungeklärt", true)}</div></div><p class="flight-note">${esc(flight.note)}</p></article>`).join("")}</section>`).join("");
  }
  function duration(flight) {
    const minutes = Math.round((new Date(flight.arrival) - new Date(flight.departure)) / 60000);
    return `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
  }
  function renderGuide(id) {
    const guide = guideFor(id) || T.guides[0];
    $("#guide-place").value = guide.id;
    $("#guide-content").innerHTML = `<article><div class="guide-intro"><div><h2>${esc(guide.title)}</h2><h3>${esc(guide.subtitle)}</h3><p>${esc(guide.intro)}</p></div><div class="guide-tip"><h3>Unser roter Faden</h3><p>${esc(guide.tip)}</p></div></div><div class="guide-columns"><section aria-label="Vorschläge vor Ort">${guide.items.map(([title, meta, description, map]) => `<article class="guide-item"><h3>${esc(title)}</h3><p class="meta">${esc(meta)}</p><p>${esc(description)}</p>${mapLink(map, "Ziel in Karte suchen")}</article>`).join("")}</section><aside><h3>Auf den Teller</h3><p>${esc(guide.food)}</p><h3>Vor Ort beachten</h3><p>${esc(guide.practical)}</p><h3>Quellen & Einordnung</h3><p class="meta">Eigene, unverbindliche Tagesvorschläge. Keine aktuellen Öffnungszeiten, Preise oder Verfügbarkeiten bestätigt.</p><div class="inline-links">${guide.sources.map((id) => { const s = T.sources.find((entry) => entry.id === id); return s.url ? link(s.url, s.title) : `<span>${esc(s.title)}</span>`; }).join("")}</div><p class="meta">Recherche- und Planungsstand: ${shortDate(T.updated)}.</p></aside></div></article>`;
  }
  function renderChecks() {
    const list = (items, prefix) => items.map(([id, title, note]) => {
      const key = `${prefix}-${id}`;
      return `<label class="check-item"><input type="checkbox" data-check="${key}"${checks[key] ? " checked" : ""}><span><strong>${esc(title)}</strong><span class="meta">${esc(note)}</span></span></label>`;
    }).join("");
    $("#tasks-content").innerHTML = list(T.tasks, "task");
    $("#packing-content").innerHTML = list(T.packing, "pack");
  }
  function renderPrivate() {
    $("#delete-private").disabled = !privateData && !storedPrivate;
    $("#private-status").textContent = privateData ? "Privatdaten geladen. Nur in diesem Browserprofil verfügbar; keine Cloud-Synchronisierung." : "Keine Privatdaten geladen.";
    $("#private-content").innerHTML = privateData ? `<h2>Reisende</h2><p>${privateData.travelers.map(esc).join(" · ")}</p>${privateData.bookings.map((booking) => `<section class="private-booking"><h2>${esc(booking.title)}</h2><dl>${booking.details.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join("")}</dl></section>`).join("")}<section class="private-booking"><h2>Private Hinweise</h2>${privateData.notes.map((note) => `<p>${esc(note)}</p>`).join("")}</section>` : "";
  }
  function renderPrint() {
    $("#print-content").innerHTML = `<h1>Indienreise 2026 / 2027</h1><p>03.12.2026–01.01.2027 · Planungsstand ${shortDate(T.updated)}</p><p class="print-warning">Öffentliche Druckansicht ohne Personen- oder Buchungsdaten. Alle Flugzeiten sind Ortszeiten, kein Live-Status. Mumbai-Ankunft ungeklärt. Rückflug am 01.01. um 03:15 Uhr: Transfer bereits am 31.12. abends.</p><h2>Reisetage</h2>${T.days.map(([date, title, , type, fixed, suggestion, important]) => { const stay = stayForDay(date); return `<article class="print-day"><time>${shortDate(date)} · ${esc(weekday(date))}</time><h3>${esc(title)} · ${esc(type)}</h3><p>${esc(fixed)}</p>${stay ? `<p class="print-hotel"><strong>Übernachtung:</strong> ${esc(stay.name)}</p>` : ""}<p><strong>Wichtig:</strong> ${esc(important)}</p><p><strong>Optional:</strong> ${esc(suggestion)}</p></article>`; }).join("")}<h2>Flüge · alle Zeiten lokal</h2>${T.flights.map((flight) => `<article class="print-flight"><strong>${esc(flight.number)} · ${esc(flight.fromName)} → ${esc(flight.toName)}</strong><p>Abflug: ${esc(dateTime(flight.departure, flight.fromZone))} · Ankunft: ${esc(flightArrival(flight))}</p><p>Terminals: ${esc(flight.fromTerminal || "offen")} → ${esc(flight.toTerminal || "offen")}. ${esc(flight.baggage)}</p><p>${esc(flight.note)}</p></article>`).join("")}<h2>Unterkünfte</h2>${T.stays.map((stay) => `<article class="print-day"><h3>${esc(stay.name)}</h3><p>${shortDate(stay.start)}–${shortDate(stay.end)} · ${stay.nights} Nacht/Nächte · gebucht</p><p>${esc(stay.address || stay.area)}. ${esc(stay.note)}</p><p>Individuelle Check-in-/Check-out-Zeiten, Zimmer, Verpflegung und Kontakte offen.</p></article>`).join("")}<h2>Offene Einzelheiten</h2>${T.tasks.map(([, title, note]) => `<p>□ <strong>${esc(title)}</strong>: ${esc(note)}</p>`).join("")}`;
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("button");
    if (!control) return;
    if (control.dataset.day) {
      selectedDate = control.dataset.day;
      renderDay();
      navigate("heute");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (control.dataset.guide) {
      renderGuide(control.dataset.guide);
      navigate("guide");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (control.dataset.hotel) {
      if (location.hash === "#hotels") { showView("hotels"); revealHotel(control.dataset.hotel); }
      else { const id = control.dataset.hotel; pendingReveal = () => revealHotel(id); location.hash = "hotels"; }
    }
    if (control.dataset.mapFocus) {
      const id = control.dataset.mapFocus;
      if (location.hash === "#karte") selectStation(id, "map");
      else { pendingReveal = () => selectStation(id, "map"); location.hash = "karte"; }
    }
    if (control.classList.contains("print-button")) window.print();
  });
  $("#travel-date").addEventListener("change", (event) => {
    if (!dayFor(event.target.value)) {
      notify("Bitte einen Reisetag zwischen dem 03.12.2026 und 01.01.2027 wählen.");
      event.target.value = selectedDate;
      return;
    }
    selectedDate = event.target.value;
    renderDay();
  });
  function moveDay(offset) {
    const index = T.days.findIndex((day) => day[0] === selectedDate);
    if (!T.days[index + offset]) return false;
    selectedDate = T.days[index + offset][0];
    renderDay();
    // Bei klebender Tageswahl den neuen Tag von oben zeigen.
    const controls = $(".date-controls");
    const content = $("#day-content").getBoundingClientRect().top;
    if (content < controls.offsetHeight) window.scrollTo({ top: window.scrollY + content - controls.offsetHeight - 8, behavior: "instant" });
    return true;
  }
  $("#previous-day").addEventListener("click", () => moveDay(-1));
  $("#next-day").addEventListener("click", () => moveDay(1));
  let touchStart = null;
  $("#day-content").addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1 && !event.target.closest("a, button, input, select") ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  $("#day-content").addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) moveDay(dx < 0 ? 1 : -1);
  }, { passive: true });
  $("#jump-today").addEventListener("click", () => {
    const today = indiaDate();
    if (dayFor(today)) { selectedDate = today; renderDay(); }
  });
  $("#guide-place").innerHTML = T.guides.map((guide) => `<option value="${esc(guide.id)}">${esc(guide.title)}</option>`).join("");
  $("#guide-place").addEventListener("change", (event) => renderGuide(event.target.value));
  document.addEventListener("change", (event) => {
    if (!event.target.matches("[data-check]")) return;
    const nextChecks = { ...checks, [event.target.dataset.check]: event.target.checked };
    if (saveStored(CHECK_KEY, nextChecks)) checks = nextChecks;
    else event.target.checked = !!checks[event.target.dataset.check];
  });
  $("#private-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error("Die Datei ist größer als 100 KB.");
      const candidate = validatePrivate(JSON.parse(await file.text()));
      if (!saveStored(PRIVATE_KEY, candidate)) {
        $("#private-status").textContent = "Import nicht gespeichert. Browser-Speicher prüfen und erneut importieren.";
        return;
      }
      privateData = candidate;
      storedPrivate = null;
      renderPrivate();
      $("#private-status").textContent = "Privatdaten erfolgreich lokal importiert. Es wurden keine Daten hochgeladen.";
    } catch (error) {
      $("#private-status").textContent = `Import fehlgeschlagen: ${error instanceof SyntaxError ? "Die Datei enthält kein gültiges JSON." : error.message} Bitte die separate Privatdatei auswählen. Bisherige Daten bleiben unverändert.`;
    } finally { event.target.value = ""; }
  });
  $("#delete-private").addEventListener("click", () => {
    try {
      localStorage.removeItem(PRIVATE_KEY);
      privateData = null;
      storedPrivate = null;
      renderPrivate();
      $("#delete-private").disabled = true;
      $("#private-status").textContent = "Lokale Privatdaten gelöscht. Die Originaldatei auf deinem Gerät wurde nicht verändert.";
    } catch (error) {
      notify(`Löschen der Privatdaten fehlgeschlagen (${error.name}). Bitte die Website-Daten in den Browser-Einstellungen löschen.`);
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === CHECK_KEY) {
      const latest = readStored(CHECK_KEY);
      if (!latest || (typeof latest === "object" && !Array.isArray(latest) && Object.values(latest).every((value) => typeof value === "boolean"))) {
        checks = latest || {};
        renderChecks();
      } else notify("Eine andere Registerkarte hat ungültige Checklisten-Daten gespeichert. Seite und Speicher prüfen.");
    }
    if (event.key === PRIVATE_KEY || event.key === null) {
      const latest = readStored(PRIVATE_KEY);
      storedPrivate = null;
      try { privateData = latest ? validatePrivate(latest) : null; renderPrivate(); }
      catch (error) { privateData = null; renderPrivate(); notify(`Privatdaten aus anderer Registerkarte nicht geladen: ${error.message}`); }
    }
  });
  $("#practical-content").innerHTML = T.practical.map(([title, text]) => `<h3>${esc(title)}</h3><p>${esc(text)}</p>`).join("");
  $("#sources-content").innerHTML = `<p>Zeiträume und Buchungsstatus durch die Reisenden bestätigt. Hotel-Suchlink-Daten wurden bewusst nicht als Buchungsnachweis übernommen. Guide-Texte sind eigene Zusammenfassungen und Vorschläge, keine übernommenen Werbetexte.</p><ul class="source-list">${T.sources.map((s) => `<li><strong>${s.url ? link(s.url, s.title) : esc(s.title)}</strong><br>${s.checked ? `Abgerufen ${shortDate(s.checked)}` : esc(s.kind)} · ${esc(s.note)}</li>`).join("")}</ul>`;
  renderDay();
  renderRoute();
  renderMap();
  renderHotels();
  renderFlights();
  renderGuide(T.guides[0].id);
  renderChecks();
  renderPrivate();
  renderPrint();
  showView(location.hash.slice(1));

  function updateConnection() {
    $("#connection").textContent = navigator.onLine ? "Online · keine Live-Flugdaten" : "Offline · gespeicherter Reiseplan";
  }
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();
  async function setupOffline() {
    const status = $("#offline-status");
    if (!("serviceWorker" in navigator) || !["https:", "http:"].includes(location.protocol)) {
      status.textContent = "Offline-Speicher nur über HTTPS oder localhost verfügbar.";
      $("#refresh-offline").disabled = true;
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Offline-Dateien konnten nicht rechtzeitig geladen werden.")), 20000);
        navigator.serviceWorker.ready.then(() => { clearTimeout(timer); resolve(); }, (error) => { clearTimeout(timer); reject(error); });
      });
      status.textContent = "Offline bereit";
      const observeWorker = () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) status.textContent = "Neuer Offline-Stand verfügbar · einmal neu laden";
          if (worker.state === "redundant") status.textContent = "Offline-Aktualisierung fehlgeschlagen · erneut versuchen";
        });
      };
      registration.addEventListener("updatefound", observeWorker);
      observeWorker();
      $("#refresh-offline").addEventListener("click", async () => {
        $("#refresh-offline").disabled = true;
        try {
          await registration.update();
          const worker = registration.installing || registration.waiting;
          if (worker && worker.state !== "activated") {
            await new Promise((resolve, reject) => {
              const timer = setTimeout(() => reject(new Error("Offline-Aktualisierung dauert zu lange.")), 20000);
              const changed = () => {
                if (worker.state === "activated" || worker.state === "redundant") {
                  clearTimeout(timer);
                  worker.removeEventListener("statechange", changed);
                  if (worker.state === "activated") resolve();
                  else reject(new Error("Offline-Dateien konnten nicht vollständig geladen werden."));
                }
              };
              worker.addEventListener("statechange", changed);
              changed();
            });
          }
          location.reload();
        } catch (error) {
          status.textContent = `Offline-Update fehlgeschlagen (${error.name}). Mit Internet erneut versuchen.`;
          $("#refresh-offline").disabled = false;
        }
      });
    } catch (error) {
      status.textContent = `Offline-Speicher nicht eingerichtet (${error.name}). Über HTTPS öffnen und Browser-Berechtigung prüfen.`;
      $("#refresh-offline").disabled = true;
    }
  }
  setupOffline();
})();
