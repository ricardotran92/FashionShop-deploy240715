/* Bảo mật Route profile nếu chưa đăng nhập bằng ProtectedRoute
container-fluid sẽ chiếm 100% chiều rộng ở tất cả breakpoint, còn container thì sẽ có khoảng trắng ở 2 bên  
*/
import "./App.css";
// React router DOM quản lý routing. Router xác định các routes. Route: URL path
import { Route, BrowserRouter as Router, Routes} from "react-router-dom"

import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
// Toast package giúp hiển thị thông báo success, error, warning... https://www.npmjs.com/package/react-hot-toast
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import Top from "./components/layout/Top";
import useUserRoutes from "./components/routes/userRoutes";
import useAdminRoutes from "./components/routes/adminRoutes";
import NotFound from "./components/layout/NotFound";



function App() {

  const userRoutes = useUserRoutes();
  const adminRoutes = useAdminRoutes();

  return (
    <Router>
      <div className="App">
      {/* "react-hot-toast" */}
      <Toaster position="top-center" />
      {/* "react-toastify" */}
      <ToastContainer 
        position="top-center"
        autoClose={2000}
        hideProgressBar={true}
        draggable
      /> 
      {/* Page header từ ./components/layout/Footer */}
      <Header/>



      <div className="container-fluid">
        <Routes>
          {userRoutes}
          {adminRoutes}
          <Route path="*" element={<NotFound />} />
        </Routes>

      </div>
      
      {/* Nút Scroll to Top */}
      <Top/>
              
      {/* Page Footer từ ./components/layout/Header*/}
      <Footer/>
    </div>
    </Router>
    
  );
}

export default App;
