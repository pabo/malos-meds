import { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import "./App.css";
import { Temporal } from "@js-temporal/polyfill";
import classNames from "classnames";

const NUM_ROWS = 10; // TODO: this is brittle, and should match what we set in grid-template-rows css

type Dose = {
  start: number;
  duration: number;
};

type Med = {
  name?: string;
  color?: string;
  doses: number[];
};

type Payload = {
  petName?: string;
  startYear?: number;
  startMonth?: number;
  meds: Med[];
};

// // JSON payload
// const _payload: Payload = {
//   petName: "Malo",
//   startYear: 2020,
//   startMonth: 1,
//   meds: [
//     {
//       name: "Rabies",
//       color: "goldenrod",
//       doses: [1, 12, 11, 5, 14, 3],
//     },
//     {
//       name: "Bravecto",
//       color: "salmon",
//       doses: [1, 3, 4, 3, 16, 6], // pairs represent doses - [dose start, dose duration]
//     },
//   ],
// };

type GridLocation = {
  row: number;
  col: number;
} | null;

export const App = () => {
  // read the hash for the payload
  let payloadFromLocationHash;

  if (window.location.hash) {
    payloadFromLocationHash = unMinifyPayload(window.location.hash.slice(1));
  }

  const [meds, setMeds] = useState(payloadFromLocationHash?.meds ?? []);
  const [startMonth, _setStartMonth] = useState(
    payloadFromLocationHash?.startMonth ?? 1
  );
  const [startYear, _setStartYear] = useState(
    payloadFromLocationHash?.startYear ?? 2020
  );
  const [dragStart, setDragStart] = useState<GridLocation>(null);
  const [hoveredCell, setHoveredCell] = useState<GridLocation>(null);
  const isDragging = dragStart !== null;
  const isNeedsInput =
    meds.length >= 1 && meds[meds.length - 1].name === undefined;

  // set the payload from the state
  window.location.hash = minifyPayload({ startMonth, startYear, meds });

  const handleMouseUp = () => {
    setDragStart(null);
    if (dragStart === null || hoveredCell === null) {
      return;
    }

    setMeds((meds) => [
      ...meds,
      {
        doses: [dragStart.col, hoveredCell.col - dragStart.col + 1],
      },
    ]);
  };

  const minDate = Temporal.PlainDate.from({
    year: startYear,
    month: startMonth,
    day: 1,
  });

  const maxDate = Temporal.Now.plainDateISO();

  const numMonths = minDate.until(maxDate, {
    smallestUnit: "month",
    largestUnit: "month",
  }).months;

  return (
    <div
      className="chart"
      style={{ gridTemplateColumns: `repeat(${numMonths}, 1fr)` }}
    >
      {new Array(numMonths).fill(null).map((_month, monthIndex) => {
        return (
          <>
            <MonthHeader
              minDate={minDate}
              index={monthIndex}
              key={monthIndex}
            />
          </>
        );
      })}
      {new Array(numMonths).fill(null).map((_month, monthIndex) => {
        return (
          <>
            {new Array(NUM_ROWS - 1).fill(null).map((_med, medIndex) => {
              const colIndex = monthIndex + 1; // 1 for 0-index
              const rowIndex = medIndex + 2; // 1 for 0-index, 1 for header row
              return (
                <EmptyCell
                  isAddingEnabled={!isNeedsInput}
                  key={medIndex}
                  row={rowIndex}
                  col={monthIndex + 1}
                  setDragStart={setDragStart}
                  setHoveredCell={setHoveredCell}
                  isHighlighted={
                    isDragging &&
                    hoveredCell !== null &&
                    dragStart?.row === rowIndex &&
                    dragStart?.col <= colIndex &&
                    colIndex <= hoveredCell.col
                  }
                  handleMouseUp={handleMouseUp}
                />
              );
            })}
          </>
        );
      })}
      {meds.map((med, index) => {
        return (
          <Med key={index} med={med} gridRow={index + 2} setMeds={setMeds} />
        );
      })}
    </div>
  );
};

type EmptyCellProps = {
  setDragStart: (loc: GridLocation) => void;
  setHoveredCell: (loc: GridLocation) => void;
  row: number;
  col: number;
  isHighlighted: boolean;
  handleMouseUp: () => void;
  isAddingEnabled: boolean;
};

const EmptyCell: FC<EmptyCellProps> = ({
  row,
  col,
  setDragStart,
  setHoveredCell,
  isHighlighted,
  handleMouseUp,
  isAddingEnabled,
}) => {
  const handleMouseDown = () => {
    if (!isAddingEnabled) {
      return;
    }

    setDragStart({ row, col });
  };

  const handleMouseEnter = () => {
    if (!isAddingEnabled) {
      return;
    }
    setHoveredCell({ row, col });
  };

  const handleMouseLeave = () => {
    if (!isAddingEnabled) {
      return;
    }
    setHoveredCell(null);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={(e) => {
        e.preventDefault();
        handleMouseDown();
      }}
      onMouseUp={handleMouseUp}
      className={classNames("emptyCell", {
        isHighlighted,
      })}
      style={{ gridColumn: `${col} / ${col}`, gridRow: `${row} / ${row}` }}
    ></div>
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

type MedProps = {
  med: Med;
  gridRow: number;
  setMeds: (cb: (meds: Med[]) => Med[]) => void;
};

const Med: FC<MedProps> = ({ med, gridRow, setMeds }) => {
  const [inputName, setInputName] = useState("");
  const { name, color, doses: condensedDoses } = med;

  const doses: Dose[] = [];
  for (let i = 0; i < condensedDoses.length; i += 2) {
    doses.push({ start: condensedDoses[i], duration: condensedDoses[i + 1] });
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputName(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "Enter") {
      setMeds((meds) =>
        meds.with(-1, { ...meds[meds.length - 1], name: inputName })
      );
    }
  };

  return (
    <>
      {doses.map(({ start, duration }, index) => {
        return (
          <div
            key={index}
            className="dose"
            style={{
              backgroundColor: color ?? "white",
              gridColumn: `${start} / ${start + duration}`,
              gridRow: `${gridRow} / ${gridRow}`,
            }}
          >
            {name ? (
              name
            ) : (
              <input
                className="medInput"
                type="text"
                value={inputName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              ></input>
            )}
          </div>
        );
      })}
    </>
  );
};

const minifyPayload = (obj: Payload): string => {
  return btoa(
    JSON.stringify([
      obj.petName,
      obj.startYear,
      obj.startMonth,
      ...obj.meds.map((med) => [med.name, med.color, med.doses]),
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
      return {
        name: med[0],
        color: med[1],
        doses: med[2],
      };
    }),
  };
};
