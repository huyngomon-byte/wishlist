export const ANNIVERSARY_KEY = "love-start-date";
export const CALENDAR_MILESTONES_KEY = "love-custom-milestones";
export const DEFAULT_DATE = "2023-02-09";

export type CustomMilestone = {
  id: string;
  title: string;
  date: string;
  note: string;
};

export const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

export const getAnniversaryDate = () => new Date(DEFAULT_DATE);

export const getAnniversaryValue = () => DEFAULT_DATE;

export const differenceInDays = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const milliseconds = end.getTime() - start.getTime();

  return Math.abs(Math.floor(milliseconds / 86400000));
};

export const readCustomMilestones = () => {
  const raw = localStorage.getItem(CALENDAR_MILESTONES_KEY);
  if (!raw) return [] as CustomMilestone[];

  try {
    const parsed = JSON.parse(raw) as CustomMilestone[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomMilestones = (items: CustomMilestone[]) => {
  localStorage.setItem(CALENDAR_MILESTONES_KEY, JSON.stringify(items));
};
