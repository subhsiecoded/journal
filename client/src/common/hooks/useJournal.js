import { useNavigate } from "react-router-dom";
import {
  toDate,
  getFormattedDate,
  getTodayDate,
  formatDate,
  compareDate,
  getNextDay,
  getStyle,
  getAvailableDate,
} from "common/helpers";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { getJournals } from "features/journal/journalSlice";
import { useDispatch } from "react-redux";

const useJournal = (date) => {
  const [css, setCss] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Memoize selector to prevent unnecessary re-renders
  const journalData = useSelector(
    ({ journals: { data, gotData, prevDates, loading } }) => {
      return {
        journals: data || {},
        gotData: Boolean(gotData),
        prevDates: prevDates || [],
        loading: Boolean(loading),
      };
    },
    (left, right) => {
      return (
        left.journals === right.journals &&
        left.gotData === right.gotData &&
        left.loading === right.loading &&
        JSON.stringify(left.prevDates) === JSON.stringify(right.prevDates)
      );
    }
  );

  const { journals, gotData, prevDates, loading } = journalData;

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    return getFormattedDate(date);
  }, [date]);

  // Memoize dates array with enhanced sorting
  const dates = useMemo(() => {
    const journalDates = Object.keys(journals);
    const allDates = [...new Set([...journalDates, ...prevDates])]; // Remove duplicates

    return allDates
      .filter((date) => date && typeof date === "string") // Ensure valid date strings
      .sort((date1, date2) => {
        // Sort in descending order (most recent first)
        const moment1 = new Date(date1);
        const moment2 = new Date(date2);
        return moment2 - moment1;
      });
  }, [journals, prevDates]);

  // Enhanced disabled days function with better performance
  const disabledDays = useMemo(() => {
    return (date) => {
      if (!date) return true;

      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) return true;

      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      const minDate = new Date(2000, 0, 1); // January 1, 2000 - more permissive

      // Only disable invalid dates, dates before 2000, or future dates
      return dateObj < minDate || dateObj > today;
    };
  }, []);

  // Set minimum date to January 1, 2000 for better UX
  const minDate = useMemo(() => {
    return new Date(2000, 0, 1);
  }, []);

  // Enhanced date validation with better error handling
  const dateValidation = useMemo(() => {
    if (!formattedDate) {
      return {
        dateIsAvailable: false,
        correctDateFormat: false,
        validDate: false,
        errorMessage: "Invalid date format",
      };
    }

    try {
      const dateObj = toDate(formattedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const minDateObj = new Date(2000, 0, 1);

      const dateIsAvailable = dateObj >= minDateObj && dateObj <= today;
      const correctDateFormat = formattedDate === date;
      const validDate = formattedDate && dateIsAvailable && correctDateFormat;

      let errorMessage = "";
      if (!dateIsAvailable) {
        if (dateObj < minDateObj) {
          errorMessage = "Date is too far in the past";
        } else if (dateObj > today) {
          errorMessage = "Cannot create journals for future dates";
        }
      }

      return {
        dateIsAvailable,
        correctDateFormat,
        validDate,
        errorMessage,
        dateObj,
      };
    } catch (error) {
      console.error("Date validation error:", error);
      return {
        dateIsAvailable: false,
        correctDateFormat: false,
        validDate: false,
        errorMessage: "Invalid date",
      };
    }
  }, [formattedDate, date]);

  const { dateIsAvailable, correctDateFormat, validDate, errorMessage } =
    dateValidation;

  // Enhanced CSS generation with error handling and performance optimization
  useEffect(() => {
    if (!Object.keys(journals).length) {
      setCss("");
      return;
    }

    const cssArr = [];

    try {
      // Generate styles for dates that have journal entries
      Object.keys(journals).forEach((journalDate) => {
        try {
          const style = getStyle(journalDate);
          if (style && style.trim()) {
            cssArr.push(style);
          }
        } catch (error) {
          console.warn(
            `Error generating style for date ${journalDate}:`,
            error
          );
        }
      });
    } catch (error) {
      console.error("Error generating CSS:", error);
    }

    const cssString = cssArr.join("");
    setCss(cssString);
  }, [journals]);

  // Fetch journals on mount with loading state
  useEffect(() => {
    const fetchJournals = async () => {
      setIsLoading(true);
      try {
        await dispatch(getJournals());
      } catch (error) {
        console.error("Error fetching journals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJournals();
  }, [dispatch]);

  // Enhanced navigation logic with better error handling
  useEffect(() => {
    if (!gotData || loading) return;

    try {
      if (!formattedDate) {
        const today = getTodayDate();
        navigate(`/journal/${today}`, { replace: true });
      } else if (!correctDateFormat && formattedDate) {
        navigate(`/journal/${formattedDate}`, { replace: true });
      } else if (!dateIsAvailable && formattedDate) {
        // If date is not available, redirect to the closest available date
        const availableDate = getAvailableDate(formattedDate, dates);
        if (availableDate) {
          navigate(`/journal/${availableDate}`, { replace: true });
        } else {
          navigate(`/journal/${getTodayDate()}`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      navigate(`/journal/${getTodayDate()}`, { replace: true });
    }
  }, [
    gotData,
    loading,
    formattedDate,
    correctDateFormat,
    dateIsAvailable,
    navigate,
    dates,
  ]);

  // Helper function to get next available date
  const getNextAvailableDate = useMemo(() => {
    return () => {
      if (!formattedDate) return getTodayDate();

      try {
        const nextDay = getNextDay(formattedDate);
        const nextDayObj = toDate(nextDay);
        const today = new Date();

        if (nextDayObj <= today) {
          return nextDay;
        }
        return getTodayDate();
      } catch (error) {
        console.error("Error getting next available date:", error);
        return getTodayDate();
      }
    };
  }, [formattedDate]);

  // Helper function to get previous available date
  const getPrevAvailableDate = useMemo(() => {
    return () => {
      if (!dates.length) return null;

      const currentIndex = dates.findIndex((d) => d === formattedDate);
      if (currentIndex > 0) {
        return dates[currentIndex - 1];
      } else if (dates.length > 0) {
        return dates[0];
      }
      return null;
    };
  }, [dates, formattedDate]);

  // Memoize return value with additional helper functions
  return useMemo(
    () => ({
      gotData,
      validDate,
      disabledDays,
      minDate,
      value: formattedDate ? toDate(formattedDate) : toDate(date),
      date,
      css,
      dates,
      isLoading: isLoading || loading,
      errorMessage,
      dateIsAvailable,
      correctDateFormat,
      journals,
      getNextAvailableDate,
      getPrevAvailableDate,
      hasJournalEntry: formattedDate && journals[formattedDate],
      totalJournals: Object.keys(journals).length,
    }),
    [
      gotData,
      validDate,
      disabledDays,
      minDate,
      date,
      formattedDate,
      css,
      dates,
      isLoading,
      loading,
      errorMessage,
      dateIsAvailable,
      correctDateFormat,
      journals,
      getNextAvailableDate,
      getPrevAvailableDate,
    ]
  );
};

export default useJournal;
