import { Content } from 'pdfmake/interfaces';
import { createHeader, createLabelText, hasValue } from '../../../shared/PDF-functions';
import { TRolaPodmiotuUpowaznionegoFA2 } from '../../../shared/consts/FA.const';
import { PodmiotUpowazniony } from '../../types/fa2.types';
import { generatePodmiotAdres } from './PodmiotAdres';
import { generateDaneIdentyfikacyjneTPodmiot1Dto } from './PodmiotDaneIdentyfikacyjneTPodmiot1Dto';
import { generatePodmiotUpowaznionyDaneKontaktowe } from './PodmiotUpowaznionyDaneKontaktowe';
import { translateMap } from '../../../shared/generators/common/functions';
import i18n from 'i18next';

export function generatePodmiotUpowazniony(podmiotUpowazniony: PodmiotUpowazniony | undefined): Content[] {
  if (!podmiotUpowazniony) {
    return [];
  }
  const result: Content[] = createHeader(i18n.t('invoice.authorizedSubject.authorizedSubject'));

  if (hasValue(podmiotUpowazniony.RolaPU)) {
    result.push(
      createLabelText(
        i18n.t('invoice.authorizedSubject.role'),
        translateMap(podmiotUpowazniony.RolaPU, TRolaPodmiotuUpowaznionegoFA2).split('-')[0] ?? ''
      )
    );
  }
  if (hasValue(podmiotUpowazniony.NrEORI)) {
    result.push(createLabelText(i18n.t('invoice.authorizedSubject.eori'), podmiotUpowazniony.NrEORI));
  }
  if (podmiotUpowazniony.DaneIdentyfikacyjne) {
    result.push(generateDaneIdentyfikacyjneTPodmiot1Dto(podmiotUpowazniony.DaneIdentyfikacyjne));
  }
  result.push([
    ...generatePodmiotAdres(podmiotUpowazniony.Adres),
    ...generatePodmiotAdres(podmiotUpowazniony.AdresKoresp, i18n.t('invoice.authorizedSubject.correspondenceAddress2')),
    ...generatePodmiotUpowaznionyDaneKontaktowe(podmiotUpowazniony.DaneKontaktowe),
  ]);

  return result;
}
