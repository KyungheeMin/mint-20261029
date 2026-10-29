export const SESSION_SECONDS = 5 * 60;
export const PHRASE_INTERVAL_SECONDS = 30;
export const FADE_OUT_MS = 3000;

export type Track = {
  id: string;
  title: string;
  composer: string;
  src: string;
  license: string;
  source: string;
};

// All recordings come from Wikimedia Commons and are public domain or CC0.
export const TRACKS: Track[] = [
  {
    id: "gymnopedie-1",
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    src: "/audio/gymnopedie-1.ogg",
    license: "Public domain",
    source:
      "https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg",
  },
  {
    id: "chopin-nocturne-op55-no1",
    title: "Nocturne Op. 55 No. 1",
    composer: "Frédéric Chopin",
    src: "/audio/chopin-nocturne-op55-no1.ogg",
    license: "CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:Chopin_-_Nocturne-op-55-no-1.ogg",
  },
  {
    id: "bach-air",
    title: "Air",
    composer: "Johann Sebastian Bach",
    src: "/audio/bach-air.ogg",
    license: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Air_(Bach).ogg",
  },
];

export const DEFAULT_TRACK_ID = TRACKS[0].id;

export const PHRASES = [
  "숨을 깊게 들이마시고, 천천히 내쉬어 보세요.",
  "저 멀리 떠 있는 작은 푸른 점, 그 위의 나를 바라봅니다.",
  "생각이 떠오르면 구름처럼 흘려보내세요.",
  "몸의 힘을 내려놓고 어깨를 편안하게 두세요.",
  "들숨과 날숨, 그것만으로 충분합니다.",
  "오늘 하루가 이 고요 위에서 시작됩니다.",
];

export const FINISH_PHRASE =
  "수고하셨습니다. 맑아진 마음으로 오늘 하루를 시작하세요.";
