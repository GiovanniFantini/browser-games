# Time Defense

Leggere README e dati canonici prima di intervenire. Questo modulo resta indipendente dagli altri giochi della raccolta.

- Dati di torri, nemici, livelli ed effetti in docs; evitare tabelle parallele nel codice.
- Mantenere le animazioni a parti rigide, senza deformare zampe o ali.
- Preservare acquisti atomici, UID delle torri, pausa e ripresa esplicita, compatibilità dei salvataggi v1 e gestione dei dati corrotti.
- Verificare cambiamenti grafici e di gameplay nel browser, oltre alla compilazione.
- Non introdurre backend, autenticazione o dipendenze runtime senza una necessità del gioco.
- Prima di modificare pipeline o configurazioni CI/CD chiedere autorizzazione esplicita a Giovanni. Una richiesta di sviluppo o push non la sostituisce.
- Preparare un risultato verificato e sottoporlo al revisore incaricato prima del passaggio al task successivo.

La copia distribuita contiene codice e risorse necessari al gioco. Le sessioni personali di revisione e gli esperimenti di authoring rimangono nell’archivio di lavoro.
