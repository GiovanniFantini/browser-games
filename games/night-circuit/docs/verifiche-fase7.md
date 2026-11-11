# Verifiche della fase 7

Data: 10 novembre 2026. Versione locale 0.7.0. Nessun servizio esterno, dipendenza, pipeline o pubblicazione introdotto.

## Perimetro

Carriera completa su quattro rivali: Nemi, Ozra, Iven e Selki, con profili originali e sfide fisiche. Reputazione separata dai crediti, bonus dall’estetica applicata, tre livelli per i nuovi acquisti, tre modelli sulla piattaforma Orvane, sostituzione del modello anche a garage pieno, tre contratti sponsor e tre servizi per riviste inventate. Telefono con messaggi persistenti, inviti e nuovi accessi. Schema del profilo v5 compatibile v1/v2/v3/v4.

I rivali aprono in sequenza Neon District, Hillcrest e Airport Belt. Sono disponibili i settori d’ingresso guidabili, con collisioni, rete stradale, traffico, garage, GPS e gare. Le scene vengono generate una volta al primo viaggio e soltanto quella corrente ha grafica e collider attivi. Le Torri, la Terrazza e gli Hangar hanno semi, altezze, luci e decorazioni distinti. Il viaggio dal telefono sostituisce i collegamenti continui, che restano nella fase 8 insieme all’estensione completa dei quartieri.

## Integrità dei progressi

Crediti, REP, sponsor e sblocchi cambiano nella stessa transazione del risultato definitivo. Nessun premio per ritiri o classifiche provvisorie. La liquidazione mantiene gli identificativi già pagati. I contratti iniziano dalla firma e ogni premio si riscuote una sola volta. I servizi fotografici usano l’aspetto applicato, producono un PNG reale e assegnano il premio soltanto dopo la generazione riuscita. Le bozze non entrano nel servizio.

I componenti già posseduti nei vecchi profili restano reinstallabili. Iniziare carriera attiva i livelli soltanto per i nuovi acquisti. Le gare veloci restano disponibili. Il parser ricostruisce i dati da identificativi ammessi; non importa testi HTML, URL o proprietà arbitrarie. Rivali fuori ordine, quartieri non aperti, contratti incoerenti e messaggi sconosciuti vengono rifiutati.

## Metodo

Node.js 24.20.0, npm 11.19.0, Chromium Playwright, Windows, WebGL software. Le gare browser avanzano il vero passo Rapier a 60 Hz usando gli stessi comandi e le stesse regole delle altre prove. Non vengono assegnati punti, reputazione, traguardi o sblocchi dal controllo QA.

Le prove delle regole verificano premi unici, bonus estetico, sconfitte, livelli, nuovi modelli, ordine dei rivali, contratti dalla firma, velocità finita, copertine, migrazione e rollback della transazione. Le geometrie dei tre modelli hanno altezze diverse e quattro ruote sugli stessi attacchi; massa, spinta e grip derivano dal modello e dai componenti.

La prova browser della campagna parte da un profilo nuovo, firma Torqen, acquista motore e kit, completa gare, ricarica fra i due arrivi, riscuote il contratto e affronta i quattro rivali. Include copertina scaricata, viaggio e GPS, acquisto della Lyra R2, slot, messaggi e ripresa finale. Una seconda prova usa un profilo di test già a 300 REP per verificare l’obiettivo Aervik con la velocità effettiva del drag e il telefono a 800 pixel.

## Garage già pieno

La verifica finale ha coperto anche i profili con tre posti occupati, che altrimenti non avrebbero potuto usare i nuovi modelli. La sostituzione mostra il ritiro al 50% del prezzo di serie e la differenza prima della conferma. Conserva slot, componenti e aspetto compatibili, lasciando intatte le altre auto. Salva una copia recuperabile dell’intero profilo; se una scrittura fallisce, non applica auto o saldo nuovi.

La prova browser dedicata verifica preparazione senza addebito, annullamento, sostituzione della Silex con Velan GT a garage pieno, saldo 40.000→22.500 CR, trasferimento di motore e kit, invariabilità delle altre due auto, ripristino e ritorno alla copia con il modello nuovo. Tre test delle regole verificano anche fondi insufficienti, livelli, identificativi e rollback in caso di quota esaurita.

## Esiti

- 66 test automatici superati in 15 file.
- Suite completa di 17 scenari browser superata, circa 47,3 minuti con rendering software. Comprende l’intera campagna da zero e le regressioni delle fasi 1-6.
- Diciottesimo scenario sul garage pieno superato separatamente, dopo la relativa correzione, in circa un minuto.
- Verifica aggiuntiva della chiusura di Nemi: vittoria con Rapier, premio unico di 3.500 CR e 80 REP, riprova del rivale completato nascosta, accesso a Neon District e successivo rivale disponibili.
- TypeScript strict, Vite, ESLint e controllo Prettier superati sulla versione 0.7.0. L’avviso sul singolo bundle grande rimane; include anche il motore fisico WebAssembly.
- Build statica finale: 12 file, 5.221.975 byte, inferiore a 15 MB.
- Prova finale sulla build distribuibile con `npm run preview`: migrazione v4→v5 con conservazione di motore, kit, record, punteggi drift, fantasma e coppa sospesa; avvio della carriera senza REP retroattivi; contratto conservato dopo ricarica; telefono a 800 pixel, tasto P e guida reale. Verificata anche la sostituzione con tre posti occupati, trasferimento di motore/kit e ripristino del saldo precedente. Superata senza errori JavaScript e senza strumenti QA o crediti, anche con il parametro `?qa=race`.
- Controllo mirato senza occorrenze dei marchi reali cercati, segnaposto incompleti o trattino lungo. Nessun controllo QA o strumento crediti nella build distribuibile.

Immagini locali controllate: copertina PNG, Neon District, garage con Lyra R2, telefono a campagna conclusa e Velan GT con personalizzazione trasferita nella build statica. Gli artefatti in `artifacts/` sono esclusi da Git.

## Limiti della verifica

Il rendering software verifica funzionamento e layout; non certifica 60 fps su GPU integrata. Il gamepad fisico non è stato provato in questa sessione. I tre modelli condividono piattaforma e compatibilità estetica; il catalogo completo di almeno 50 auto resta successivo. Le nuove aree sono settori d’ingresso con rete stradale comune, senza simulare una città continua già completata. Radio, impostazioni complete, altri contenuti dei quartieri e localizzazione restano nella fase 8.
