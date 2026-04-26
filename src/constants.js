export const CONTENT_PHASES = [
  {
    id: 'calibration', title: 'Kalibracja', subtitle: 'Kim teraz jesteś?', kanji: '今',
    questions: [
      { id: 'c1', text: 'Co Cię tu przyprowadziło? Skąd ta potrzeba odkrycia kierunku właśnie teraz?', hint: 'Nie ma złej odpowiedzi. Opisz to, co czujesz.' },
      { id: 'c2', text: 'Jak oceniasz swój obecny stan — jesteś w spokojnym poszukiwaniu, czy raczej w punkcie przełomowym?', hint: 'To ważne, żebym mógł dostosować perspektywę naszej rozmowy.' },
    ],
  },
  {
    id: 'present', title: 'Teraźniejszość', subtitle: 'Małe sygnały, wielkie wskazówki', kanji: '今',
    questions: [
      { id: 'p1', text: 'Przypomnij sobie ostatni tydzień. Był moment — może krótki — gdy poczułeś/aś coś w rodzaju "tak, o to chodzi". Opisz go.', hint: 'Może być zupełnie zwykły moment.' },
      { id: 'p2', text: 'Co robisz, że czas przestaje dla Ciebie istnieć? Nie musisz tego umieć ani na tym zarabiać.', hint: 'Chodzi o stan przepływu — flow.' },
      { id: 'p3', text: 'Czego uczysz lub tłumaczysz innym z naturalną łatwością — nawet jeśli nie traktujesz tego jako umiejętność?', hint: 'Często nie doceniamy tego, co przychodzi nam łatwo.' },
    ],
  },
  {
    id: 'strengths', title: 'Zasoby', subtitle: 'Twoje naturalne talenty', kanji: '力',
    questions: [
      { id: 's1', text: 'Co przychodzi Ci naturalnie, choć inni mówią że to trudne? Co robisz bez wysiłku?', hint: 'Talent często jest niewidoczny dla jego właściciela.' },
      { id: 's2', text: 'Kiedy czujesz się najbardziej "sobą" w działaniu? W pracy z ludźmi? Sam/a z problemem? Tworząc coś?', hint: 'Opisz to przez konkretne sytuacje.' },
      { id: 's3', text: 'Gdybyś miał/a opisać siebie przez trzy czasowniki (nie cechy, ale działania) — co byś wybrał/a?', hint: 'Np. "organizuję / rozwiązuję / buduję / łączę / leczę / tworzę"' },
    ],
  },
  {
    id: 'shadow', title: 'Cień i Lustro', subtitle: 'Co mówi to, czego nie widzisz', kanji: '影',
    info: 'Prawo Lustra służy do autorefleksji — NIE do obwiniania się za to, co robią inni.',
    questions: [
      { id: 'sh1', text: 'Co szczególnie podziwiasz w innych ludziach? Jaką cechę lub umiejętność — taką, którą czujesz że "chciałbyś/chciałabyś mieć"?', hint: 'To, co podziwiamy w innych, często jest częścią nas samych — jeszcze nieodkrytą.' },
      { id: 'sh2', text: 'Jakie role, zawody lub życiowe drogi fascynują Cię, choć nigdy nie śmiałeś/aś ich wybrać? Co powstrzymało?', hint: 'Fascynacja jest wskazówką. Powstrzymanie — też.' },
      { id: 'sh3', text: 'Opisz 3 momenty w swoim życiu, gdy czułeś/aś największy sens lub radość. Co je łączy?', hint: 'Wzorce w tych momentach często wskazują na twoje Ikigai.' },
    ],
  },
  {
    id: 'impostor', title: 'Syndrom Oszusta', subtitle: 'Głosy, które Cię zatrzymują', kanji: '鏡',
    questions: [
      { id: 'i1', text: 'Czy zdarza Ci się myśleć, że twoje sukcesy to "przypadek" lub "szczęście"? Że "za chwilę wszyscy zobaczą, że nic nie wiem"?', hint: 'To bardzo powszechne. Opisz jak to u Ciebie wygląda.' },
      { id: 'i2', text: 'Opowiedz o swoim ostatnim prawdziwym sukcesie — czymś, z czego jesteś dumny/a. Jaką konkretną rolę odegrałeś/aś TY?', hint: 'Konkretnie — Twoja rola, Twoje działania, Twoje decyzje.' },
      { id: 'i3', text: 'Co by powiedział o Tobie ktoś, kto Cię dobrze zna i szczerze szanuje — o Twoich kompetencjach?', hint: 'Rozbieżność między tym jak widzą nas inni a jak my siebie — to właśnie obszar Syndromu Oszusta.' },
    ],
  },
  {
    id: 'synthesis', title: 'Synteza', subtitle: 'Twój kierunek', kanji: '道',
    questions: [
      { id: 'sy1', text: 'Gdybyś miał/a opisać swoje Ikigai jako obraz, metaforę lub krótką historię — co by to było?', hint: 'Nie szukaj "właściwej" odpowiedzi. Szukaj prawdziwej.' },
      { id: 'sy2', text: 'Opisz jeden dzień swojego życia za 5 lat — dzień, który czujesz jako "swój". Co robisz? Z kim jesteś? Jak się czujesz wstając rano?', hint: 'Pozwól sobie marzyć. Szczegóły są ważne.' },
      { id: 'sy3', text: 'Jaki jeden mały krok możesz zrobić w tym tygodniu — w kierunku tego, co czujesz jako swoje?', hint: 'Małe kroki mają w sobie całą moc.' },
    ],
  },
];

export const CORRECTION_PHASE_IDS = ['present', 'strengths', 'synthesis'];

export const TOTAL_QUESTIONS = CONTENT_PHASES.reduce((a, p) => a + p.questions.length, 0);
