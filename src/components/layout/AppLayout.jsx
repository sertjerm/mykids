const AppLayout = ({ children }) => {
  const isAdmin = window.location.search.includes("admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 via-blue-100 to-green-100">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto">
          <div className="text-right mb-4">
            <a
              href={isAdmin ? "/" : "/?admin"}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isAdmin ? "← กลับหน้าหลัก" : "⚙️ ตั้งค่า"}
            </a>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
