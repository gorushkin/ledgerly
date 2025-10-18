import dayjs from 'dayjs';

const DATE_FORMAT = 'YYYY-MM-DD';

export const formatDate = (date: Date): string => {
  return dayjs(date).format(DATE_FORMAT);
};

export const parseDate = (dateString: string): Date | null => {
  const parsed = dayjs(dateString, DATE_FORMAT, true);
  return parsed.isValid() ? parsed.toDate() : null;
};

export const getTodayDateString = (): string => {
  return dayjs().format(DATE_FORMAT);
};
