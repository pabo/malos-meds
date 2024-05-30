import {
  FC,
  Fragment,
  useEffect,
  useState,
  ChangeEvent,
  useRef,
  useCallback,
} from "react";
import "./App.css";
import { Temporal } from "@js-temporal/polyfill";
import { EmptyCell } from "./EmptyCell";
import { GridLocation, Med, Payload } from "./types";
import { Medication } from "./Medication";

const useEffectSkipFirst = (fn: () => any, deps: any[]) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return fn();
  }, deps);
};

const NUM_ROWS = 13; // TODO: this is brittle, and should match what we set in grid-template-rows css
const DEFAULT_START_YEAR = 2021;
const DEFAULT_START_MONTH = 1;
const NUM_FUTURE_MONTHS = 12;

export const App = () => {
  const [meds, setMeds] = useState<Med[]>([]);
  const [petName, setPetName] = useState("petName");
  const [startMonth, setStartMonth] = useState(DEFAULT_START_MONTH);
  const [startYear, setStartYear] = useState(DEFAULT_START_YEAR);

  const [dragStart, setDragStart] = useState<GridLocation>(null);
  const [hoveredCell, setHoveredCell] = useState<GridLocation>(null);
  const isDragging = dragStart !== null;
  const isNeedsInput =
    meds.length >= 1 && meds[meds.length - 1].name === undefined;

  // TODO all of this state/hash shit is DIRTY. Needs to extract logic, or use pre-made solution
  // on initial load, populate the state from the hash
  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    populateStateFromHash();
  }, []);

  const populateStateFromHash = (hash?: string) => {
    const strippedHash = (hash ? hash : window.location.hash).slice(1);
    const payload = unMinifyPayload(strippedHash);

    setMeds(payload.meds);
    if (payload.petName) setPetName(payload.petName);
    if (payload.startMonth) setStartMonth(payload.startMonth);
    if (payload.startYear) setStartYear(payload.startYear);
  };

  // subscribe to hash changes to update state
  const handleHashChange = useCallback((e: HashChangeEvent) => {
    const hash = e.newURL.slice(e.newURL.indexOf("#"));
    populateStateFromHash(hash);
  }, []);

  useEffect(() => {
    addEventListener("hashchange", handleHashChange);
  }, [meds, startMonth, startYear, petName]);

  // on any state change, update the hash
  useEffectSkipFirst(() => {
    // we don't want an infinte loop of hash updates state, state updates hash, so we unsubscribe
    // from the hash change when we are setting it from state
    removeEventListener("hashchange", handleHashChange);

    window.location.hash = minifyPayload({
      petName,
      startMonth,
      startYear,
      meds,
    });

    // wtf, setting the location hash above is deferred, and so we need to defer adding the handler back
    setTimeout(() => addEventListener("hashchange", handleHashChange), 0);
  }, [meds, petName, startMonth, startYear]);

  useEffect(() => {
    document.title = getTitle(petName);
  }, [petName]);

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const scrollAmount = e.deltaY;
    container.scrollTo({
      top: 0,
      left: container.scrollLeft - scrollAmount,
      behavior: "instant",
    });
  };

  const handleClear = () => {
    setMeds([]);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPetName(e.target.value);
  };

  // add a dose, either for a new drug or for this rows drug
  const handleMouseUp = () => {
    setDragStart(null);
    setHoveredCell(null);

    if (
      dragStart === null ||
      hoveredCell === null ||
      dragStart.col > hoveredCell.col
    ) {
      return;
    }

    const newDose = {
      start: dragStart.col,
      duration: hoveredCell.col - dragStart.col + 1,
    };

    if (dragStart.row <= meds.length + 1) {
      const medIndex = dragStart.row - 2;

      setMeds((meds) =>
        meds.with(medIndex, {
          ...meds[medIndex],
          doses: [...meds[medIndex].doses, newDose],
        })
      );

      return;
    }

    setMeds((meds) => [
      ...meds,
      {
        doses: [newDose],
      },
    ]);
  };

  const minDate = Temporal.PlainDate.from({
    year: startYear,
    month: startMonth,
    day: 1,
  });

  const maxDate = Temporal.Now.plainDateISO();

  const numMonths =
    minDate.until(maxDate, {
      smallestUnit: "month",
      largestUnit: "month",
    }).months + NUM_FUTURE_MONTHS;

  return (
    <>
      <div
        className="chart"
        onWheel={handleScroll}
        style={{ gridTemplateColumns: `repeat(${numMonths}, 1fr)` }}
      >
        {new Array(numMonths).fill(null).map((_month, monthIndex) => {
          return (
            <Fragment key={monthIndex}>
              <MonthHeader minDate={minDate} index={monthIndex} />
            </Fragment>
          );
        })}
        {new Array(numMonths).fill(null).map((_month, monthIndex) => {
          return (
            <Fragment key={monthIndex}>
              {new Array(NUM_ROWS - 1).fill(null).map((_med, medIndex) => {
                const colIndex = monthIndex + 1; // +1 for 0-index
                const rowIndex = medIndex + 2; // +1 for 0-index, +1 for header row
                return (
                  <EmptyCell
                    key={medIndex}
                    row={rowIndex}
                    col={monthIndex + 1}
                    isAddingEnabled={!isNeedsInput}
                    setDragStart={setDragStart}
                    setHoveredCell={setHoveredCell}
                    isHighlighted={
                      (hoveredCell &&
                        hoveredCell.row === rowIndex &&
                        hoveredCell.col === colIndex) ||
                      (isDragging &&
                        hoveredCell !== null &&
                        dragStart?.row === rowIndex &&
                        dragStart?.col <= colIndex &&
                        colIndex <= hoveredCell.col)
                    }
                    handleMouseUp={handleMouseUp}
                  />
                );
              })}
            </Fragment>
          );
        })}
        {meds.map((med, medIndex) => {
          return (
            <Medication
              key={medIndex}
              med={med}
              gridRow={medIndex + 2}
              setMeds={setMeds}
              updateMed={(newMed) => {
                setMeds((med) => med.with(medIndex, newMed));
              }}
            />
          );
        })}
      </div>
      Your pets name:
      <input onChange={handleChange} value={petName}></input>
      <br></br>
      <button onClick={handleClear}>Clear all meds</button>
    </>
  );
};

type MonthHeaderProps = {
  minDate: Temporal.PlainDate;
  index: number;
};

const MonthHeader: FC<MonthHeaderProps> = ({ minDate, index }) => {
  const date = minDate.add({ months: index });
  const monthName = date.toLocaleString("default", { month: "short" });

  return (
    <div
      className="monthHeader"
      style={{ gridColumn: `${index + 1} / ${index + 1}` }}
      key={index}
    >
      {monthName} {date.year}
    </div>
  );
};

const minifyPayload = (obj: Payload): string => {
  return btoa(
    JSON.stringify([
      obj.petName,
      obj.startYear,
      obj.startMonth,
      ...obj.meds.map((med) => [
        med.name,
        med.color,
        med.doses.map((dose) => [dose.start, dose.duration]).flat(),
      ]),
    ])
  );
};

const unMinifyPayload = (string: string): Payload => {
  const partsArray = JSON.parse(atob(string));

  const [petName, startYear, startMonth, ...meds] = partsArray;

  return {
    petName,
    startYear,
    startMonth,
    meds: meds.map((med: any) => {
      const doses = [];
      const condensedDoses = med[2];
      for (let i = 0; i < condensedDoses.length; i += 2) {
        doses.push({
          start: condensedDoses[i],
          duration: condensedDoses[i + 1],
        });
      }

      return {
        name: med[0],
        color: med[1],
        doses,
      };
    }),
  };
};

const getTitle = (petName: string) => {
  if (!petName) {
    return "Med Tracker";
  }

  const wordMap = new Map([
    ["A", "Antidotes"],
    ["C", "Cure-alls"],
    ["D", "Drugs"],
    ["E", "Elixirs"],
    ["F", "Pharmacy"],
    ["H", "Healing"],
    ["M", "Meds"],
    ["N", "Narcotics"],
    ["P", "Prescriptions"],
    ["R", "Remedies"],
    ["T", "Tinctures"],
  ]);
  const word = wordMap.get(petName[0].toUpperCase());

  return `${petName}'s ${word ? word : "Meds"}`;
};
