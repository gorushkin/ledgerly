import dayjs from "dayjs";

const ISO_8601_DATE_FORMAT = "YYYY-MM-DD";
export const dateInIsoFormat = dayjs().format(ISO_8601_DATE_FORMAT);
