// Hàm này được sử dụng để tạo và gửi token JWT cho người dùng, sau đó đặt token trong cookie và gửi phản hồi về client
export default (user, statusCode, res, loginType='local') => {
// Lấy token JWT từ người dùng
  const token = user.getJwtToken();
// Thiết lập các tùy chọn cho cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),// Thời gian hết hạn của cookie
    httpOnly: true,// Cookie chỉ có thể được truy cập qua HTTP, không thể được truy cập qua JavaScript trong trình duyệt
  };

  if (loginType === 'local') {
    // Đặt cookie chứa token trong phản hồi với các tùy chọn đã thiết lập
    res.status(statusCode).cookie("token", token, options).json({
      token, // Trả về token dưới dạng phản hồi JSON
    });
  } else if (loginType === 'google'){
    // Đặt cookie chứa token trong phản hồi với các tùy chọn đã thiết lập
    res.cookie("token", token, options);

    // Chuyển hướng người dùng đến localhost:3000 để cập nhật hồ sơ
    // res.status(statusCode).redirect('https://unwilling-enid-ricardotran-952ec3c3.koyeb.app');
    
  } else if (loginType === 'facebook'){
    res.cookie("token", token, options);
  }
  res.status(statusCode).redirect(process.env.NODE_ENV === 'DEVELOPMENT' ? process.env.FRONTEND_URL : process.env.FRONTEND_PROD_URL);

}; 