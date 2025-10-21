export function ReconnectingBanner() {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="font-bold">Reconnecting to game...</span>
        </div>
      </div>
    </div>
  );
}
