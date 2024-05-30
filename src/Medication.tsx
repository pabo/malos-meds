import { FC, useState, ChangeEvent, KeyboardEvent } from "react";
import { Med } from "./types";

const medColors = [
  "#1a80bb",
  "#ea801c",
  "#a559aa",
  "#f55f74",
  "#50ad9f",
  "#f2c45f",
  "#62c8d3",
  "#d22d2d",
  "#2dd22d",
  "#d2d22d",
];

type MedicationProps = {
  med: Med;
  gridRow: number;
  setMeds: (cb: (meds: Med[]) => Med[]) => void;
  updateMed: (med: Med) => void;
};

export const Medication: FC<MedicationProps> = ({
  med,
  gridRow,
  setMeds,
  updateMed,
}) => {
  const [inputName, setInputName] = useState("");
  const { name, color, doses } = med;
  const medIndex = gridRow - 2;

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

  const deleteDose = (doseIndex: number) => {
    // this is the only dose, so delete the med
    if (med.doses.length === 1) {
      setMeds((meds) => [
        ...meds.slice(0, medIndex),
        ...meds.slice(medIndex + 1),
      ]);

      return;
    }

    updateMed({
      ...med,
      doses: [
        ...med.doses.slice(0, doseIndex),
        ...med.doses.slice(doseIndex + 1),
      ],
    });
  };

  return (
    <>
      {doses.map(({ start, duration }, doseIndex) => {
        return (
          <div
            onClick={() => deleteDose(doseIndex)}
            key={doseIndex}
            className="dose"
            style={{
              backgroundColor: color ?? medColors[medIndex] ?? "white",
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
                autoFocus
              ></input>
            )}
          </div>
        );
      })}
    </>
  );
};
