**GO PRODUZIONE**

Avevo detto che con le correzioni 1, 2 e 4 il verdetto sarebbe diventato GO. Ora sono soddisfatte tutte e sei:

1. **Mobile:** il pulsante è fisso in basso e interamente visibile in `opening-gather2.jpg`. Quando scegli, la mappa si ingrandisce (×1,27, `valley.css:770-785`). La prova browser passa.
2. **Seconda squadra:** cesto e scudo hanno costi separati ("−1 Legna · +1 Razioni").
3. **Terrazza:** la riga è sparita. Ora terrazza e riparo hanno la stessa forma ("Annulla ordine").
4. **Sorveglianza:** l'esito mostra "Razioni 2 → 2".
5. **Luoghi:** Approdo e Focolare si vedono fin dall'inizio, attenuati (`Valley.tsx:403`).
6. **Nota iniziale:** la regola del digiuno compare solo dopo la prima stagione senza cibo (`Valley.tsx:715`).

Da sistemare dopo, senza bloccare:
- La nuova riga `highWaterCosts` ("Il cibo è prima della cena") è oscura.
- Su mobile il pulsante fisso copre cesto e scudo, quindi bisogna scorrere.
- In `browser.json` la partita "barca" finisce in inglese ("A new shore").
