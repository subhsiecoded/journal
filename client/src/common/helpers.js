import moment from "moment";
import { convertFromRaw } from "draft-js";

const numOfAlarmMinutes = 3;
const beforeToday = 1;

const getMonth = (date) => {
  // Ensure proper date parsing
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in getMonth:", date);
    return moment().format("YYYY-MM");
  }
  return momentDate.format("YYYY-MM");
};

export const getAvailableDate = (date, dates) => {
  if (!date || !dates || dates.length === 0) {
    return null;
  }

  const month = getMonth(date);
  const day = dates.find((date) => date.includes(month));
  return day || dates[0]; // Return first available date if no match found
};

const convertTimeToStr = (time) => {
  const momentTime = moment(time);
  if (!momentTime.isValid()) {
    console.error("Invalid time in convertTimeToStr:", time);
    return moment().format();
  }
  return momentTime.format();
};

export const getAlarm = () => {
  const alarm = moment().add(numOfAlarmMinutes, "minutes");
  return convertTimeToStr(alarm);
};

export const compareDate = (date1, date2) => {
  const formattedDate1 = moment(date1);
  const formattedDate2 = moment(date2 || new Date());

  if (!formattedDate1.isValid() || !formattedDate2.isValid()) {
    console.error("Invalid dates in compareDate:", date1, date2);
    return false;
  }

  return formattedDate1 <= formattedDate2;
};

export const getLatestMinDate = () => {
  const min = formatDate(
    moment().subtract(beforeToday, "months").add(beforeToday, "days")
  );
  return min;
};

export const getStyledDate = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in getStyledDate:", date);
    return moment().format("ddd MMM DD YYYY");
  }
  return momentDate.format("ddd MMM DD YYYY");
};

export const getMinDate = (date, dates, prevDates) => {
  const beforeNow = getLatestMinDate();

  if (!date) {
    return moment(beforeNow).toDate();
  }

  const momentDate = moment(date);
  const momentBeforeNow = moment(beforeNow);

  if (!momentDate.isValid()) {
    return momentBeforeNow.toDate();
  }

  const dateIsEarlier = momentDate <= momentBeforeNow;
  if (dateIsEarlier) {
    return momentDate.toDate();
  }
  return momentBeforeNow.toDate();
};

export const today = () => moment().toDate();

export const toDate = (date) => {
  if (!date) return new Date();

  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in toDate:", date);
    return new Date();
  }
  return momentDate.toDate();
};

export const getTodayDate = () => moment().format("YYYY-MM-DD");

export const formatDate = (date) => {
  if (!date) return null;

  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in formatDate:", date);
    return null;
  }
  return momentDate.format("YYYY-MM-DD");
};

const checkIfValid = (date) => {
  if (!date) return false;
  return moment(date).isValid();
};

export const getResultDate = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in getResultDate:", date);
    return moment().format("MMMM D, YYYY");
  }
  return momentDate.format("MMMM D, YYYY");
};

export const getLongDate = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in getLongDate:", date);
    return moment().format("dddd, MMMM D, YYYY");
  }
  return momentDate.format("dddd, MMMM D, YYYY");
};

export const isTimeUp = (date) => compareDate(date);

export const getFormattedDate = (date) => {
  const isValid = checkIfValid(date);
  return isValid ? formatDate(date) : null;
};

// Enhanced getText function with text direction normalization
export const getText = (content) => {
  try {
    let text = convertFromRaw(content).getPlainText();

    // Ensure proper text direction - normalize any reversed text
    if (text && typeof text === "string") {
      // Remove any RTL/LTR override characters that might cause issues
      text = text.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");

      // Ensure proper character ordering for Latin text
      // This is a basic check - if the text appears to be reversed Latin characters
      if (/^[a-zA-Z\s\d.,!?;:'"-]+$/.test(text)) {
        // Additional validation can be added here if needed
        return text;
      }
    }

    return text || "";
  } catch (error) {
    console.error("Error converting content:", error);
    return "";
  }
};

export const getNextDay = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    console.error("Invalid date in getNextDay:", date);
    return formatDate(moment().add(1, "days"));
  }
  const next = momentDate.add(1, "days");
  return formatDate(next);
};

export const formatJournals = (data) => {
  const result = {};
  const dates = [];

  if (!Array.isArray(data)) {
    console.error("Invalid data in formatJournals:", data);
    return [result, dates];
  }

  for (const row of data) {
    try {
      const { date, content, title } = row;
      const text = getText(content);
      const formatedDate = formatDate(date);

      if (formatedDate) {
        result[formatedDate] = {
          title: normalizeText(title),
          content,
          text: normalizeText(text),
        };
        dates.push(formatedDate);
      }
    } catch (error) {
      console.error("Error processing journal row:", error, row);
    }
  }
  return [result, dates];
};

// Helper function to normalize text direction
const normalizeText = (text) => {
  if (!text || typeof text !== "string") return text;

  // Remove bidirectional control characters that might cause text reversal
  return text.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
};

export const removeContent = (journals, date) => {
  const result = { ...journals };
  delete result[date];
  return result;
};

export const countWords = (str) => {
  if (!str || typeof str !== "string") return 0;

  // Normalize the string first
  const normalizedStr = normalizeText(str);
  const regex = /\s+/; // More robust whitespace splitting
  const words = normalizedStr.split(regex).filter((word) => word.trim());
  return words.length;
};

export const getStatusStr = (saved) => {
  return saved ? "Saved" : saved === false ? "Saving..." : "";
};

export const getStyle = (date) => {
  const formattedDate = getStyledDate(date);
  return `
    .calendar-container
    .DayPicker-Day[aria-label="${formattedDate}"][aria-disabled="false"][aria-selected="false"]
   .bp4-datepicker-day-wrapper {
    color: #4f82bd;
   }
   `;
};
