import Calendar from "./Calendar/";
import Editor from "./Editor/";
import Search from "./Search/";

const Main = ({ disabledDays, minDate, value, date, dates }) => {
  return (
    <div className="Journal">
      <div className="calendar-container">
        <Search />
        <Calendar {...{ disabledDays, minDate, value, dates }} />
      </div>
      <Editor date={date} />
    </div>
  );
};

export default Main;