import { RodzajFaktury } from '../enums/invoice.enums';

export const TRodzajFaktury: Record<string, string> = Object.keys(RodzajFaktury).reduce(
  (acc, key) => {
    const typedKey = key as keyof typeof RodzajFaktury;

    acc[typedKey] = typedKey;
    return acc;
  },
  {} as Record<keyof typeof RodzajFaktury, string>
);

export const TypKorekty: Record<string, string> = {
  '1': 'Korekta skutkująca w dacie ujęcia faktury pierwotnej',
  '2': 'Korekta skutkująca w dacie wystawienia faktury korygującej',
  '3': 'Korekta skutkująca w dacie innej, w tym gdy dla różnych pozycji faktury korygującej daty te są różne',
};

export const TStawkaPodatku_FA1: Record<string, string> = {
  '23': '23%',
  '22': '22%',
  '8': '8%',
  '7': '7%',
  '5': '5%',
  '4': '4% lub 3% lub oo',
  '3': '4% lub 3% lub oo',
  '0': '0%',

  zw: 'zwolnione z opodatkowania',
  oo: '4% lub 3% lub oo\nUWAGA: oo jest wykazywane łącznie z 4% lub 3%',
  np: 'niepodlegające opodatkowaniu-transakcje dostawy towarów oraz świadczenia usług poza terytorium kraju',
};

export const TStawkaPodatku_FA2: Record<string, string> = {
  '23': '23%',
  '22': '22%',
  '8': '8%',
  '7': '7%',
  '5': '5%',
  '4': '4%',
  '3': '3%',
  '0': '0%',

  zw: 'zwolnione od podatku',
  oo: 'odwrotne obciążenie',
  np: 'niepodlegające opodatkowaniu-transakcje dostawy towarów oraz świadczenia usług poza terytorium kraju',
};

export const TStawkaPodatku_FA3: Record<string, string> = {
  '23': '23%',
  '22': '22%',
  '8': '8%',
  '7': '7%',
  '5': '5%',
  '4': '4%',
  '3': '3%',

  '0 KR': '0% - KR',
  '0 WDT': '0% - WDT',
  '0 EX': '0% - EX',

  zw: 'zw',
  oo: 'oo',

  'np I': 'np I',
  'np II': 'np II',
};

export const FA3RolaPodmiotu3: Record<string, string> = {
  '1': 'Faktor - w przypadku gdy na fakturze występują dane faktora',
  '2': 'Odbiorca - w przypadku gdy na fakturze występują dane jednostek wewnętrznych, oddziałów, wyodrębnionych w ramach nabywcy, które same nie stanowią nabywcy w rozumieniu ustawy',
  '3': 'Podmiot pierwotny - w przypadku gdy na fakturze występują dane podmiotu będącego w stosunku do podatnika podmiotem przejętym lub przekształconym, który dokonywał dostawy lub świadczył usługę. Z wyłączeniem przypadków, o których mowa w art. 106j ust.2 pkt 3 ustawy, gdy dane te wykazywane są w części Podmiot1K',
  '4': 'Dodatkowy nabywca - w przypadku gdy na fakturze występują dane kolejnych (innych niż wymieniony w części Podmiot2) nabywców',
  '5': 'Wystawca faktury - w przypadku gdy na fakturze występują dane podmiotu wystawiającego fakturę w imieniu podatnika. Nie dotyczy przypadku, gdy wystawcą faktury jest nabywca',
  '6': 'Dokonujący płatności - w przypadku gdy na fakturze występują dane podmiotu regulującego zobowiązanie w miejsce nabywcy',
  '7': 'Jednostka samorządu terytorialnego - wystawca',
  '8': 'Jednostka samorządu terytorialnego - odbiorca',
  '9': 'Członek grupy VAT - wystawca',
  '10': 'Członek grupy VAT - odbiorca',
  '11': 'Pracownik',
};

export const FA2RolaPodmiotu3: Record<string, string> = {
  '1': 'Faktor - w przypadku, gdy na fakturze występują dane faktora',
  '2': 'Odbiorca - w przypadku, gdy na fakturze występują dane jednostek wewnętrznych, oddziałów, wyodrębnionych w ramach nabywcy, które same nie stanowią nabywcy w rozumieniu ustawy',
  '3': 'Podmiot pierwotny - w przypadku, gdy na fakturze występują dane podmiotu będącego w stosunku do podatnika podmiotem przejętym lub przekształconym, który świadczył usługę lub dokonywał dostawy. Z wyłączeniem przypadków, o których mowa w art. 106j ust.2 pkt 3 ustawy, gdy dane te wykazywane są w części Podmiot1K',
  '4': 'Dodatkowy nabywca - w przypadku, gdy na fakturze występują dane kolejnych (innych niż wymieniony w części Podmiot2) nabywców',
  '5': 'Wystawca faktury - w przypadku, gdy na fakturze występują dane podmiotu wystawiającego fakturę w imieniu podatnika. Nie dotyczy przypadku, gdy wystawcą faktury jest nabywca',
  '6': 'Dokonujący płatności - w przypadku, gdy na fakturze występują dane podmiotu regulującego zobowiązanie w miejsce nabywcy',
  '7': 'Jednostka samorządu terytorialnego - wystawca',
  '8': 'Jednostka samorządu terytorialnego - odbiorca',
  '9': 'Członek grupy VAT - wystawca',
  '10': 'Członek grupy VAT - odbiorca',
};

export const FA1RolaPodmiotu3: Record<string, string> = {
  '1': 'Faktor - w przypadku, gdy na fakturze występują dane faktora',
  '2': 'Odbiorca - w przypadku, gdy na fakturze występują dane jednostek wewnętrznych, oddziałów, wyodrębnionych w ramach nabywcy, które same nie stanowią nabywcy w rozumieniu ustawy',
  '3': 'Podmiot pierwotny - w przypadku, gdy na fakturze występują dane podmiotu będącego w stosunku do podatnika podmiotem przejętym lub przekształconym, który świadczył usługę lub dokonywał dostawy. Z wyłączeniem przypadków, o których mowa w art. 106j ust.2 pkt 3 ustawy, gdy dane te wykazywane są w części Podmiot1K',
  '4': 'Dodatkowy nabywca - w przypadku, gdy na fakturze występują dane kolejnych (innych niż wymieniony w części Podmiot2) nabywców',
  '5': 'Wystawca faktury - w przypadku, gdy na fakturze występują dane podmiotu wystawiającego fakturę w imieniu podatnika. Nie dotyczy przypadku, gdy wystawcą faktury jest nabywca',
  '6': 'Dokonujący płatności - w przypadku, gdy na fakturze występują dane podmiotu regulującego zobowiązanie w miejsce nabywcy',
};

export const TRolaPodmiotuUpowaznionegoFA3: Record<string, string> = {
  '1': 'Organ egzekucyjny - w przypadku, o którym mowa w art. 106c pkt 1 ustawy',
  '2': 'Komornik sądowy - w przypadku, o którym mowa w art. 106c pkt 2 ustawy',
  '3': 'Przedstawiciel podatkowy - w przypadku gdy na fakturze występują dane przedstawiciela podatkowego, o którym mowa w art. 18a - 18d ustawy',
};

export const TRolaPodmiotuUpowaznionegoFA2: Record<string, string> = {
  '1': 'Organ egzekucyjny - w przypadku, o którym mowa w art. 106c pkt 1 ustawy',
  '2': 'Komornik sądowy - w przypadku, o którym mowa w art. 106c pkt 2 ustawy',
  '3': 'Przedstawiciel podatkowy - w przypadku, gdy na fakturze występują dane przedstawiciela podatkowego, o którym mowa w przepisach art. 18a - 18d ustawy',
};

export const TRolaPodmiotuUpowaznionegoFA1: Record<string, string> = {
  '1': 'Organ egzekucyjny - w przypadku, o którym mowa w art. 106c pkt 1 ustawy',
  '2': 'Komornik sądowy - w przypadku, o którym mowa w art. 106c pkt 2 ustawy',
  '3': 'Przedstawiciel podatkowy - w przypadku, gdy w fakturze występują dane przedstawiciela podatkowego, o którym mowa w przepisach art. 18a - 18d ustawy',
};

export const FormaPlatnosci: Record<string, string> = {
  '1': 'Gotówka',
  '2': 'Karta',
  '3': 'Bon',
  '4': 'Czek',
  '5': 'Kredyt',
  '6': 'Przelew',
  '7': 'Mobilna',
};

export const RodzajTransportu: Record<string, string> = {
  '1': 'Transport morski',
  '2': 'Transport kolejowy',
  '3': 'Transport drogowy',
  '4': 'Transport lotniczy',
  '5': 'Przesyłka pocztowa',
  '7': 'Stałe instalacje przesyłowe',
  '8': 'Żegluga śródlądowa',
};

export const TypRachunkowWlasnych: Record<string, string> = {
  '1': 'Rachunek banku lub rachunek spółdzielczej kasy oszczędnościowo-kredytowej służący do dokonywania rozliczeń z tytułu nabywanych przez ten bank lub tę kasę wierzytelności pieniężnych',
  '2': 'Rachunek banku lub rachunek spółdzielczej kasy oszczędnościowo-kredytowej wykorzystywany przez ten bank lub tę kasę do pobrania należności od nabywcy towarów lub usług za dostawę towarów lub świadczenie usług, potwierdzone fakturą, i przekazania jej w całości albo części dostawcy towarów lub usługodawcy',
  '3': 'Rachunek banku lub rachunek spółdzielczej kasy oszczędnościowo-kredytowej prowadzony przez ten bank lub tę kasę w ramach gospodarki własnej, niebędący rachunkiem rozliczeniowym',
};

export const Procedura: Record<string, string> = {
  '1': 'Stawka 0% stosowana w ramach sprzedaży krajowej',
  '2': 'Stawka 0% - wewnątrzwspólnotowa dostawa towarów',
  '3': 'Stawka 0% - eksport towarów',
  '4': 'Dostawa towarów oraz świadczenie usług opodatkowane poza terytorium kraju',
  '5': 'Świadczenie usług z art. 100 ust. 1 pkt 4 ustawy',
  '6': 'Towar/usługa wymienione w załączniku 15',
  '7': 'Pozostała sprzedaż krajowa',
};

export const DEFAULT_TABLE_LAYOUT: {
  hLineWidth: () => number;
  hLineColor: () => string;
  vLineWidth: () => number;
  vLineColor: () => string;
} = {
  hLineWidth: (): number => 1,
  hLineColor: (): string => '#BABABA',
  vLineWidth: (): number => 1,
  vLineColor: (): string => '#BABABA',
};

export const TAXPAYER_STATUS: Record<string, string> = {
  '1': 'Stan likwidacji',
  '2': 'Postępowanie restrukturyzacyjne',
  '3': 'Stan upadłości',
  '4': 'Przedsiębiorstwo w spadku',
};

const LEGACY_TAXPAYER_STATUS_MAP: Record<string, string> = {
  SAMO: '1',
  zarejestrowany: '2',
  'stan upadłości': '3',
  'przedsiębiorstwo w spadku': '4',
};

export function normalizeTaxpayerStatus(statusCode: string | number | null | undefined): string | undefined {
  if (statusCode === null || statusCode === undefined) {
    return undefined;
  }

  const trimmedCode = statusCode.toString().trim();

  if (TAXPAYER_STATUS[trimmedCode]) {
    return trimmedCode;
  }

  const legacyKey = Object.keys(LEGACY_TAXPAYER_STATUS_MAP).find(
    (key) => key.toLowerCase() === trimmedCode.toLowerCase()
  );

  if (legacyKey) {
    return LEGACY_TAXPAYER_STATUS_MAP[legacyKey];
  }

  return undefined;
}

export function getTaxpayerStatusDescription(statusCode: string | number | null | undefined): string | undefined {
  const normalizedCode = normalizeTaxpayerStatus(statusCode);
  return normalizedCode ? TAXPAYER_STATUS[normalizedCode] : undefined;
}
