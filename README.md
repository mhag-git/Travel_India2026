# Indienreise 2026 / 2027

Statischer, deutschsprachiger Reisebegleiter ohne Build, Paketinstallation oder Backend.

## Manuell auf GitHub Pages veröffentlichen

1. Die Dateien aus diesem Ordner direkt in das Stammverzeichnis des Repositorys `TravelPlan_India2026` hochladen, nicht als zusätzlichen Unterordner `github`. Bestehende fremde Dateien vor dem Ersetzen prüfen.
2. Benötigt werden `index.html`, `styles.css`, `app.js`, `data.js`, `sw.js`, `icon.svg` und `manifest.webmanifest`. `.nojekyll` ebenfalls hochladen, falls die Oberfläche versteckte Dateien anbietet. README, PRODUCT und DESIGN können mit hochgeladen werden.
3. Unter **Settings → Pages → Build and deployment** die Quelle **Deploy from a branch** auswählen, den verwendeten Branch (z. B. `main`) und **/(root)** speichern. Sollte Pages für das Konto/Repository nicht verfügbar sein, zunächst dessen Berechtigungen und Tarif prüfen.
4. Nach erfolgreicher Bereitstellung lautet die erwartete Adresse: `https://mhag-git.github.io/TravelPlan_India2026/`. Maßgeblich ist die URL, die GitHub unter Pages anzeigt.
5. Website auf jedem Reisegerät einmal mit Internet öffnen, „Offline bereit“ abwarten, bei Bedarf Privatdatei importieren und anschließend im Flugmodus testen.

**Nicht hochladen:** die Datei `Indienreise_2026_PRIVAT_NICHT_HOCHLADEN.json` im übergeordneten Reiseordner, Excel, PDFs, Buchungscodes, Ticketnummern, authentifizierte Links oder eigene Kopien davon. `.gitignore` schützt nur bei Git-Nutzung, nicht vor manuellem Hochladen im Browser.

## Lokal ansehen

`index.html` lässt sich direkt im Browser öffnen. Offline-Speicherung funktioniert erst über HTTPS oder localhost. Für eine vollständige lokale Vorschau optional aus diesem Ordner:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Danach `http://127.0.0.1:8080/` öffnen. Zum Beenden im Terminal Strg+C drücken.

## Privatdatei

Unter **Privatdaten** die separate JSON-Datei auswählen. Der Browser liest sie lokal, validiert das Format und speichert ausschließlich unterstützte Textfelder in `localStorage`. Es findet kein Upload statt. Import auf jedem Gerät separat durchführen. Die Speicherung ist unverschlüsselt und an Website-Adresse, Browserprofil und Gerät gebunden; Browserdaten können gelöscht oder verdrängt werden. Keine gemeinsam genutzten Geräte verwenden.

Private Daten sind nur im privaten Bereich sichtbar und werden in keiner Druckansicht ausgegeben. **Lokale Privatdaten löschen** entfernt den gespeicherten Import, nicht die Originaldatei. Originaltickets zusätzlich sicher offline mitführen. Keine automatische Synchronisierung, keine Wiederherstellung aus GitHub.

Dateiformat:

```json
{
  "schemaVersion": 1,
  "tripId": "india-2026",
  "travelers": [],
  "bookings": [
    {
      "journey": "outbound",
      "title": "Private Flugbuchung",
      "details": [["Buchungscode", "NUR LOKAL ERGÄNZEN"]]
    }
  ],
  "notes": []
}
```

Erlaubte `journey`-Werte: `outbound`, `goa-blr`, `blr-cok`, `return`. Keine Dokumentenanhänge, HTML oder zusätzlichen Felder erforderlich. Namen, Tickets, Sitze und Mahlzeiten stehen in der erzeugten Privatdatei. Zahlungs-/Kreditkartendaten und authentifizierte Hotellinks wurden bewusst nicht übernommen.

## Daten pflegen

- `data.js`: öffentliche Route, Unterkünfte, Kartenkoordinaten (`atlas`, ungefähr), Flüge, Tagesvorschläge, Aufgaben, Packliste und Quellen.
- `app.js`: Darstellung, lokale Checklisten und Privatdatenimport.
- `styles.css`: responsive Gestaltung und ausschließlich öffentliche Druckansicht.
- Nach Inhaltsänderungen in `sw.js` die Versionskennung erhöhen (aktuell `india2026-v3`, beim nächsten Mal `india2026-v4`). Geänderte Dateien gemeinsam hochladen. Danach Website neu laden; gegebenenfalls **Offline-Stand aktualisieren** verwenden und ein zweites Mal laden, wenn ein neuer Stand angezeigt wird.

Flugdaten enthalten den vollständigen Zeitpunkt einschließlich UTC-Offset und die jeweilige Flughafen-Zeitzone. **Keine Ortszeiten ohne Anpassung des Offsets ändern.** Bei AI 2028 ist `arrival` absichtlich `null`; zwei mögliche Ankunftszeiten stehen unter `arrivalCandidates`. Erst nach eindeutiger Klärung `arrival` setzen und Hinweise, Aufgaben sowie Tagesplan anpassen.

Die Website lädt keine fremden Bilder, Schriftarten, Karten oder Analysedienste. Externe Quellen und Kartensuchen öffnen sich ausschließlich nach Klick in einem neuen Tab ohne Referrer. Der Service Worker speichert nur eine feste Liste öffentlicher Dateien. Er gilt nur für dieses Website-Unterverzeichnis.

## Datenstand und offene Angaben

Stand 18.10.2026. Quelle: lokal ausgewertete Excel und vier Flug-PDFs; Aufenthaltszeiträume und Buchungsstatus wurden von den Reisenden bestätigt. Alle Unterkünfte und Bodentransfers sind organisiert, deren Einzelheiten fehlen teils.

Offen: gültige Mumbai-Ankunft (09:15/09:40), internationale Freigepäckgrenzen, nicht genannte Terminals, Hotelbuchungsleistungen und Kontakte, Hausbootanbieter/Anleger sowie Abholzeiten. Guide-Vorschläge sind keine Buchungen und keine bestätigten Öffnungszeiten. Genaue Hoteladressen wurden nicht erfunden; Kartensuchen müssen mit den Gastgebern abgeglichen werden.

Die Rückreise endet flugseitig in **Frankfurt**, nicht Stuttgart. KU 358 startet am **01.01.2027 um 03:15 Uhr**; Flughafenfahrt und Hotelabreise sind bereits am **31.12.2026 abends** zu planen.
