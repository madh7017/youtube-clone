import React from 'react';

function FilterChips({ chips, active, onChange }) {
  return (
    <div className="filter-chips" role="tablist" aria-label="Video filters">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          className={`chip-button ${active === chip.value ? 'active' : ''}`}
          onClick={() => onChange(chip.value)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export default FilterChips;
