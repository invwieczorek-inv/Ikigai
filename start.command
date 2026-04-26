#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Instalacja zaleznosci..."
  npm install || { echo "BLAD: npm install"; read -p "Nacisnij Enter..."; exit 1; }
fi

if [ ! -d "dist" ]; then
  echo "Budowanie aplikacji..."
  npm run build || { echo "BLAD: build"; read -p "Nacisnij Enter..."; exit 1; }
fi

echo ""
echo " Ikigai dziala na http://localhost:3000"
echo " Zamknij to okno, zeby zatrzymac."
echo ""

(sleep 2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

node server.js
