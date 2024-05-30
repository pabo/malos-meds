import { FC } from "react";
import { GridLocation } from "./types";
import classNames from "classnames";

type EmptyCellProps = {
  setDragStart: (loc: GridLocation) => void;
  setHoveredCell: (loc: GridLocation) => void;
  row: number;
  col: number;
  isHighlighted: boolean;
  handleMouseUp: () => void;
  isAddingEnabled: boolean;
};

export const EmptyCell: FC<EmptyCellProps> = ({
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
