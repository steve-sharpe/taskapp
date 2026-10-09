export default function ConfirmDialog({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <p className="text-lg text-gray-800 mb-6 font-medium">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}