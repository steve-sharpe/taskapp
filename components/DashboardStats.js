export default function DashboardStats({ tasks, currentFilter, onFilterChange }) {
  const openCount = tasks.filter(t => !t.done).length;
  const doneCount = tasks.filter(t => t.done).length;
  const ianCount = tasks.filter(t => !t.done && t.ian).length;
  const vendorCount = tasks.filter(t => !t.done && t.vendor).length;

  const StatBox = ({ label, count, filterValue }) => (
    <button
      onClick={() => onFilterChange(filterValue)}
      className={`p-4 rounded-lg border-2 text-center transition-colors ${
        currentFilter === filterValue 
          ? 'bg-brand-red-light border-brand-red text-brand-charcoal' 
          : 'bg-white border-gray-200 hover:border-brand-red text-gray-700'
      }`}
    >
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-black">{count}</div>
    </button>
  );

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatBox label="Open" count={openCount} filterValue="OPEN" />
      <StatBox label="Done" count={doneCount} filterValue="DONE" />
      <StatBox label="Ian" count={ianCount} filterValue="IAN" />
      <StatBox label="Vendor" count={vendorCount} filterValue="VENDOR" />
    </div>
  );
}