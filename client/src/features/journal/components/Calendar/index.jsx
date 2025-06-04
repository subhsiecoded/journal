import "./Calendar.css";
import { DatePicker } from "@blueprintjs/datetime";
import { Classes } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";
import { formatDate, today, getAvailableDate } from "common/helpers";
import moment from "moment";

const settings = () => {
  return {
    className: Classes.ELEVATION_1,
    highlightCurrentDay: true,
    maxDate: today(),
    // Add these settings to show all years from 2020
    minDate: new Date(2020, 0, 1), // January 1, 2020
    showActionsBar: true,
    canClearSelection: false,
    // Enable year dropdown with full range
    yearRange: [2020, moment().year()],
  };
};

const Calendar = ({ value, disabledDays, minDate, dates }) => {
  const navigate = useNavigate();
  
  const changeHandler = (date) => {
    if (date) {
      // Ensure date is a valid Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date provided to changeHandler:', date);
        return;
      }
      
      const formattedDate = formatDate(dateObj);
      
      // Navigate to the selected date regardless of whether it has content
      navigate(`/journal/${formattedDate}`);
    }
  };

  return (
    <DatePicker
      {...settings()}
      value={value}
      onChange={changeHandler}
      // Remove dayPickerProps to allow all dates to be selectable
      dayPickerProps={{
        // Only disable future dates, allow all past dates
        disabledDays: (date) => {
          const today = new Date();
          const dateObj = date instanceof Date ? date : new Date(date);
          return dateObj > today;
        }
      }}
    />
  );
};

export default Calendar;