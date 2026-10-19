# Gestaltung des Reisebegleiters

## Nutzung

Aufgabenorientierte Tagesansicht, ergänzt durch lesbare Ortsguides. Primäre Szene: Smartphone unterwegs, häufig im hellen Tageslicht und mit begrenztem Netz. Deshalb heller Grund, kräftige Textkontraste und keine dekorativen Hintergrundbilder oder externen Schriftarten.

## Visuelle Sprache

Systemschrift Segoe UI / system-ui. Dunkles Petrol `#123f43`, heller mineralischer Grund `#f4f6f3`, dunkler Text `#172f32`, sekundärer Text `#536568`. Limettengrün `#d8ef83` markiert das Tagesblatt. Warmes Warnfeld für offene Angaben, nicht für normale Vorschläge.

Offene Zeilen, klare Trennungen, wenig Container. Das petrolfarbene Tagesblatt ist die zentrale Fläche; rechts stehen Flug und Transfer. Unterkunftslisten folgen der Chronologie, Flüge zeigen beide Flughäfen mit Datum und jeweiliger Zeitzone.

## Verhalten

Bis 850 px Breite (und auf Touch-Geräten im Querformat bis 500 px Höhe) werden Spalten untereinander angeordnet. Die Hauptnavigation wird zur festen Leiste am unteren Rand im Daumenbereich: Tag, Route, Karte, Hotels, Flüge, Guide und „Mehr“ (Organisation, Privatdaten, Drucken). Aktive Ziele erhalten eine limettengrüne Icon-Pille; Safe-Areas (Notch, Home-Indikator) werden berücksichtigt. Der Kopf ist kompakt mit Kurzdatum. Im Tagesplan klebt die Tageswahl mit großen Vor-/Zurück-Tasten oben; das Tagesblatt lässt sich per horizontaler Wischgeste wechseln. Routenzeilen sind vollflächig antippbar, Hotel-Aktionen erscheinen als breite Tasten, Buchungsdetails sind einklappbar. Eingabefelder nutzen mindestens 16 px Schrift, damit iOS nicht zoomt. Auf dem Desktop bleibt die horizontale Registernavigation. Bedienelemente sind mindestens 44 px hoch, Fokus ist sichtbar, reduzierte Bewegung wird respektiert. Keine automatische Standortabfrage und keine fremden Netzwerkanfragen ohne Link-Klick.

Der Reiter „Karte“ zeigt eine eigene, offline gezeichnete SVG-Übersicht (Indiens Süden plus Kerala-Detail) ohne Kartenkacheln: nummerierte Petrol-Marker für Unterkünfte, durchgezogene Linien für Landwege, gestrichelte Bögen für Flüge, weiße Quadrate für Flughäfen. Auswahl färbt Marker und Stationszeile limettengrün; Marker sind per Tastatur bedienbar. Positionen sind bewusst ungefähr; Google Maps öffnet sich erst per Klick.

Gebucht, vorgeschlagen und ungeklärt werden textlich unterschieden. Alle Inhalte der Druckansicht werden ausschließlich aus den öffentlichen Reisedaten erzeugt. Private Buchungsdaten gehören niemals in öffentliche Tagesansichten oder Druckausgaben.
