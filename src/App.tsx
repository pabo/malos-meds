import { ChangeEvent, FC, Fragment, KeyboardEvent, useState } from "react";
import "./App.css";
import { Temporal } from "@js-temporal/polyfill";
import { EmptyCell } from "./EmptyCell";
import { GridLocation, Dose, Payload, Med } from "./types";
import { Medication } from "./Medication";

const NUM_ROWS = 10; // TODO: this is brittle, and should match what we set in grid-template-rows css
const DEFAULT_START_YEAR = 2020;
const DEFAULT_START_MONTH = 1;

export const App = () => {
  // read the hash for the payload
  let payloadFromLocationHash;

  if (window.location.hash) {
    payloadFromLocationHash = unMinifyPayload(window.location.hash.slice(1));
  }

  const [meds, setMeds] = useState(payloadFromLocationHash?.meds ?? []);
  const [startMonth, _setStartMonth] = useState(
    payloadFromLocationHash?.startMonth ?? DEFAULT_START_MONTH
  );
  const [startYear, _setStartYear] = useState(
    payloadFromLocationHash?.startYear ?? DEFAULT_START_YEAR
  );
  const [dragStart, setDragStart] = useState<GridLocation>(null);
  const [hoveredCell, setHoveredCell] = useState<GridLocation>(null);
  const isDragging = dragStart !== null;
  const isNeedsInput =
    meds.length >= 1 && meds[meds.length - 1].name === undefined;

  // set the payload from the state
  window.location.hash = minifyPayload({ startMonth, startYear, meds });

  const handleClear = () => {
    setMeds([]);
  };

  const handleMouseUp = () => {
    setDragStart(null);
    if (dragStart === null || hoveredCell === null) {
      return;
    }

    setMeds((meds) => [
      ...meds,
      {
        doses: [
          {
            start: dragStart.col,
            duration: hoveredCell.col - dragStart.col + 1,
          },
        ],
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
    <>
      <div
        className="chart"
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
            </Fragment>
          );
        })}
        {meds.map((med, index) => {
          return (
            <Medication
              key={index}
              med={med}
              gridRow={index + 2}
              setMeds={setMeds}
              updateMed={() => {}}
            />
          );
        })}
      </div>
      <button onClick={handleClear}>Clear all doses</button>
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
