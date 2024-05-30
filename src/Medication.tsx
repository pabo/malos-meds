import { FC, useState, ChangeEvent, KeyboardEvent } from "react";
import { Dose, Med } from "./types";

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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {};

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "Enter") {
      setMeds((meds) =>
        meds.with(-1, { ...meds[meds.length - 1], name: inputName })
      );
    }
  };

  const handleClick = (index) => {
    updateMed({ ...med, doses: med.doses.filter((dose) => true) });
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
