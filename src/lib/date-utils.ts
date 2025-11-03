import { format, parse, isValid } from 'date-fns';

export const parseDateSafely = (dateString: string | number | Date | undefined | null): string => {
  if (!dateString) return format(new Date(), 'yyyy-MM-dd');

  if (dateString instanceof Date) {
    return format(dateString, 'yyyy-MM-dd');
  }

  if (typeof dateString === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + dateString * 24 * 60 * 60 * 1000);
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
  }

  const formats = [
    'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy',
    'dd/MM/yy', 'MM/dd/yy', 'yy-MM-dd', 'dd-MM-yy',
    'yyyy/MM/dd', 'yyyy.MM.dd',
  ];

  for (const fmt of formats) {
    const parsed = parse(String(dateString), fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  }

  const nativeParsed = new Date(String(dateString));
  if (isValid(nativeParsed)) {
    return format(nativeParsed, 'yyyy-MM-dd');
  }

  return format(new Date(), 'yyyy-MM-dd');
};