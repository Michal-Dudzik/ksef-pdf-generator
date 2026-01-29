import { Content } from 'pdfmake/interfaces';
import { createHeader, createLabelText, formatText, getTable } from '../../../shared/PDF-functions';
import FormatTyp from '../../../shared/enums/common.enum';
import { Podmiot2 } from '../../types/fa3.types';
import { generateAdres } from './Adres';
import { generateDaneIdentyfikacyjneTPodmiot2Dto } from './PodmiotDaneIdentyfikacyjneTPodmiot2Dto';
import { generateDaneKontaktowe } from './PodmiotDaneKontaktowe';
import { DaneIdentyfikacyjneTPodmiot2Dto } from '../../types/fa2-additional-types';

export function generatePodmiot2(podmiot2: Podmiot2): Content[] {
  const result: Content[] = createHeader('Nabywca');

  result.push(
    createLabelText('Identyfikator nabywcy: ', podmiot2.IDNabywcy),
    createLabelText('Numer EORI: ', podmiot2.NrEORI)
  );
  if (podmiot2.DaneIdentyfikacyjne) {
    result.push(
      ...generateDaneIdentyfikacyjneTPodmiot2Dto(
        podmiot2.DaneIdentyfikacyjne as DaneIdentyfikacyjneTPodmiot2Dto
      )
    );
  }

  if (podmiot2.Adres) {
    result.push(formatText('Adres', [FormatTyp.Label, FormatTyp.LabelMargin]), generateAdres(podmiot2.Adres));
  }
  if (podmiot2.AdresKoresp) {
    result.push(
      formatText('Adres do korespondencji', [FormatTyp.Label, FormatTyp.LabelMargin]),
      ...generateAdres(podmiot2.AdresKoresp)
    );
  }
  if (podmiot2.DaneKontaktowe || podmiot2.NrKlienta) {
    result.push(
      formatText('Dane kontaktowe', [FormatTyp.Label, FormatTyp.LabelMargin]),
      ...generateDaneKontaktowe(podmiot2.DaneKontaktowe ?? []),
      createLabelText('Numer klienta: ', podmiot2.NrKlienta)
    );
  }

  // Check for JST and GV tags - can be directly in Podmiot2 or in DaneKontaktowe
  const daneKontaktowe = getTable(podmiot2.DaneKontaktowe);
  const jst = podmiot2.JST || (daneKontaktowe.length > 0 ? daneKontaktowe[0].JST : undefined);
  const gv = podmiot2.GV || (daneKontaktowe.length > 0 ? daneKontaktowe[0].GV : undefined);

  if (jst) {
    result.push(
      createLabelText(
        'Faktura dotyczy jednostki podrzędnej JST: ',
        jst._text === '1' ? 'TAK' : 'NIE'
      )
    );
  }
  if (gv) {
    result.push(
      createLabelText(
        'Faktura dotyczy członka grupy GV: ',
        gv._text === '1' ? 'TAK' : 'NIE'
      )
    );
  }
  return result;
}
