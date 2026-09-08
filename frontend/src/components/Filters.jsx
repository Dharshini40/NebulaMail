import { useMail } from '../hooks/useMail';

export default function Filters() {
  const { filters, setFilters, loadInbox } = useMail();

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const apply = () => loadInbox(filters);

  const reset = () => {
    setFilters({ sender: '', keyword: '', after: '', before: '', unread: false });
    loadInbox({});
  };

  return (
    <div className="filter-bar">
      <input
        value={filters.sender}
        onChange={(e) => update({ sender: e.target.value })}
        placeholder="Sender"
        className="filter-input"
      />
      <input
        value={filters.keyword}
        onChange={(e) => update({ keyword: e.target.value })}
        placeholder="Keyword"
        className="filter-input"
      />
      <input
        type="date"
        value={filters.after}
        onChange={(e) => update({ after: e.target.value })}
        className="filter-input filter-date"
      />
      <span className="filter-to">to</span>
      <input
        type="date"
        value={filters.before}
        onChange={(e) => update({ before: e.target.value })}
        className="filter-input filter-date"
      />
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={filters.unread}
          onChange={(e) => update({ unread: e.target.checked })}
          className="checkbox"
        />
        Unread
      </label>
      <button className="button button-primary button-small" onClick={apply}>
        Apply
      </button>
      <button className="button button-secondary button-small" onClick={reset}>
        Reset
      </button>
    </div>
  );
}