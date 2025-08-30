const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 via-blue-100 to-green-100">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
