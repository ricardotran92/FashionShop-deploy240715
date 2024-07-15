import { query } from "express";
import Product from "../models/product.js"; // Import model Product từ đường dẫn ../models/product.js
import Order from "../models/order.js";
import APIFilters from "../utils/apiFilters.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { delete_file, upload_file } from "../utils/cloudinary.js";

/*
Hàm điều khiển (controller functions) cho các file routes và xác định route
Các điều khiển và các logic cho tài nguyên sản phẩm (product resource)
*/

export const getProducts = catchAsyncErrors(async (req, res) => {
  // Số sản phẩm trên mỗi trang
  const resPerPage = 8;
  let topRatedProducts = [];

  // Check if it's a request for the Homepage by looking for the absence of specific filters
  const isHomepageRequest = !req.query.keyword && !req.query.category && !req.query.subCategory && !req.query.subSubCategory;

  if (isHomepageRequest) {
    // topRatedProducts = await Product.find().sort({ ratings: -1 }).limit(8);
    topRatedProducts = await Product.aggregate([
      {
        $match: {
          ratings: { $gte: 4 }
        }
      },
      // {
      //   $addFields: {
      //     reviewsCount: { $size: "$reviews" }
      //   }
      // },
      {
        // $sort: { reviewsCount: -1 }
        $sort: { numOfReviews: -1 }
      },
      {
        $limit: 12
      }
    ]);
  } // Fetch the top 8 rated products for the Homepage

  // Áp dụng bộ lọc từ yêu cầu API
  const apiFilters = new APIFilters(Product, req.query)
                          .search()
                          .filters()
                          .sorting();


  // Lấy danh sách sản phẩm đã được lọc
  let products = await apiFilters.query;
  // Số lượng sản phẩm sau khi được lọc
  let filteredProductsCount = products.length;

  // Phân trang sản phẩm
  apiFilters.pagination(resPerPage);
  // Lấy lại danh sách sản phẩm sau khi phân trang
  products = await apiFilters.query.clone();

  // Trả về danh sách sản phẩm đã được lọc và phân trang
  res.status(200).json({
    resPerPage,// Số sản phẩm trên mỗi trang
    filteredProductsCount,// Số sản phẩm sau khi được lọc
    products, // Danh sách sản phẩm
    topRatedProducts: isHomepageRequest ? topRatedProducts : [], // Optionally include top rated products in every response
  });
});



// Admin - Tạo sản phẩm mới với đường dẫn => /api/admin/products
export const newProduct = catchAsyncErrors( async (req, res) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
    // Thiết lập người dùng tạo sản phẩm bằng ID của người dùng đang đăng nhập
    req.body.user = req.user._id;

    const product = await Product.create(req.body); // Tạo một sản phẩm mới từ dữ liệu được gửi trong yêu cầu và gán cho biến product
    res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
        product, // Trả về thông tin của sản phẩm mới được tạo
    });
});


//Tìm 1 sản phẩm mới với đường dẫn => /products/:id
export const getProductDetails = catchAsyncErrors( async (req, res) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
    const product = await Product.findById(req?.params?.id).populate('reviews.user'); // Tạo một sản phẩm mới từ dữ liệu được gửi trong yêu cầu và gán cho biến product

    if(!product) {
        return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));   //sử dụng một instance của lớp ErrorHandler và gọi hàm next để trả về lỗi 404
    }

    res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
        product, // Trả về thông tin của sản phẩm mới được tạo
    });
});

// Get danh mục sản phẩm - ADMIN => /products/admin/products
export const getAdminProducts = catchAsyncErrors( async (req, res, next) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
  const products = await Product.find(); // Tạo một sản phẩm mới từ dữ liệu được gửi trong yêu cầu và gán cho biến product
  // console.log(products);

  res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
      products, // Trả về thông tin của sản phẩm mới được tạo
  });
});

// Update chi tiết sản phẩm => /products/:id
export const updateProduct = catchAsyncErrors( async (req, res) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
    let product = await Product.findById(req?.params?.id ); // Tìm kiếm sản phẩm: sử dụng phương thức findById của Mongoose để tìm kiếm sản phẩm với ID được cung cấp trong yêu cầu (req.params.id).

    if(!product) {       //Kiểm tra sự tồn tại của sản phẩm:
        return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));   //sử dụng một instance của lớp ErrorHandler và gọi hàm next để trả về lỗi 404
    }

    product = await Product.findByIdAndUpdate(req?.params?.id, req.body, {
        new: true,
    });


    res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
        product, // Trả về thông tin của sản phẩm mới được tạo
    });
});

// Upload hình ảnh sản phẩm => api/admin/products/:id/upload_images
export const uploadProductImages = catchAsyncErrors( async (req, res) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
  let product = await Product.findById(req?.params?.id ); // Tìm kiếm sản phẩm: sử dụng phương thức findById của Mongoose để tìm kiếm sản phẩm với ID được cung cấp trong yêu cầu (req.params.id).

  if(!product) {       //Kiểm tra sự tồn tại của sản phẩm:
      return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));   //sử dụng một instance của lớp ErrorHandler và gọi hàm next để trả về lỗi 404
  }

  const uploader = async (image) => upload_file(image, "fashionshop/products")

  const urls = await Promise.all((req?.body?.images).map(uploader));

  product?.images?.push(...urls);
  await product?.save();

  res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
      product, // Trả về thông tin của sản phẩm mới được tạo
  });
});

// Delete hình ảnh sản phẩm => api/admin/products/:id/delete_image
export const deleteProductImage = catchAsyncErrors( async (req, res) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
  let product = await Product.findById(req?.params?.id ); // Tìm kiếm sản phẩm: sử dụng phương thức findById của Mongoose để tìm kiếm sản phẩm với ID được cung cấp trong yêu cầu (req.params.id).

  if(!product) {       //Kiểm tra sự tồn tại của sản phẩm:
      return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));   //sử dụng một instance của lớp ErrorHandler và gọi hàm next để trả về lỗi 404
  }

  const isDeleted = await delete_file(req.body.imgId); // make sure chọn đúng delete_file from cloudinary.js

  if (isDeleted) {
    product.images = product?.images?.filter(
      (img) => img.public_id !== req.body.imgId
    );

    await product?.save();
  }

  res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được tạo
      product, // Trả về thông tin của sản phẩm mới được tạo
  });
});


//Xóa sản phẩm với đường dẫn => /products/:id
export const deleteProduct = catchAsyncErrors(  async (req, res, next) => { // Khai báo hàm điều khiển newProduct nhận req và res làm tham số
  const product = await Product.findById(req?.params?.id ); // Tìm kiếm sản phẩm: sử dụng phương thức findById của Mongoose để tìm kiếm sản phẩm với ID được cung cấp trong yêu cầu (req.params.id).

  if(!product) {
    //throw new error()
      return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));   //sử dụng một instance của lớp ErrorHandler và gọi hàm next để trả về lỗi 404
  }

  // Delete hình ảnh của sản phẩm từ Cloudinary
  for (let i = 0; i < product?.images?.length; i++) {
    await delete_file(product?.images[i]?.public_id);
  }

  await product.deleteOne(); //Nếu sản phẩm tồn tại, sử dụng phương thức deleteOne để xóa sản phẩm khỏi cơ sở dữ liệu.


  res.status(200).json({ // Trả về mã trạng thái 200 và dữ liệu JSON chứa thông tin sản phẩm mới được xóa
      message: "Đã xóa sản phẩm",
  });
});


// Create/Update product review  =>  /api/reviews
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
  // Trích xuất thông tin đánh giá từ yêu cầu
  const { rating, comment, productId, orderID } = req.body;

  // Tạo đối tượng đánh giá
  const review = {
    user: req?.user?._id, // ID của người dùng đánh giá
    rating: Number(rating), // Điểm đánh giá
    comment, // Bình luận
    order: orderID,
  };

  // Tìm sản phẩm trong cơ sở dữ liệu bằng ID
  const product = await Product.findById(productId);

  // Kiểm tra xem sản phẩm có tồn tại không
  if (!product) {
    // Nếu không tìm thấy sản phẩm, trả về lỗi với mã trạng thái 404
    return next(new ErrorHandler("Sản phẩm không tồn tại", 404));
  }

  // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
  const isReviewed = product?.reviews?.find(
    (r) => r.user.toString() === req?.user?._id.toString() && r.order.toString() === orderID.toString()
  );

  // Nếu người dùng đã đánh giá sản phẩm, cập nhật đánh giá
  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review?.user?.toString() === req?.user?._id.toString()) {
        review.comment = comment;
        review.rating = rating;
        review.order = orderID;
      }
    });
  } else {
    // Nếu người dùng chưa đánh giá sản phẩm, thêm đánh giá mới
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  // Tính toán lại điểm đánh giá trung bình của sản phẩm
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // Lưu thay đổi vào cơ sở dữ liệu
  await product.save({ validateBeforeSave: false });

  // Trả về thành công với mã trạng thái 200
  res.status(200).json({
    success: true,
  });
});





// Get product reviews  =>  /api/reviews
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const { productID, orderID } = req.query;

  const product = await Product.findOne({
    _id: productID,
    'reviews.order': orderID,
  }).populate('reviews.user');

  if (!product) {
    return next(new ErrorHandler('Sản phẩm không tồn tại hoặc không có đánh giá cho order này', 404));
  }

  // Filter reviews to only include those matching the orderID
  const reviews = product.reviews.filter(review => review.order.toString() === orderID);

  res.status(200).json({
    reviews,
  });
});
  
  // Delete product review   =>  /api/admin/reviews
  export const deleteReview = catchAsyncErrors(async (req, res, next) => {
    // Tìm sản phẩm trong cơ sở dữ liệu bằng ID
    let product = await Product.findById(req.query.productId);
  
    // Kiểm tra xem sản phẩm có tồn tại không
    if (!product) {
      // Nếu không tìm thấy sản phẩm, trả về lỗi với mã trạng thái 404
      return next(new ErrorHandler("Sản phẩm không tồn tại", 404));
    }
  
    // Lọc ra các đánh giá mà không có ID trùng với ID của đánh giá cần xóa
    const reviews = product?.reviews?.filter(
      (review) => review._id.toString() !== req?.query?.id.toString()
    );
  
    // Số lượng đánh giá mới sau khi xóa
    const numOfReviews = reviews.length;
  
    // Tính toán lại điểm đánh giá trung bình của sản phẩm
    const ratings =
      numOfReviews === 0
        ? 0
        : product.reviews.reduce((acc, item) => item.rating + acc, 0) /
          numOfReviews;
  
    // Cập nhật sản phẩm với các thông tin mới
    product = await Product.findByIdAndUpdate(
      req.query.productId,
      { reviews, numOfReviews, ratings },
      { new: true }
    );
  
    // Trả về thành công với mã trạng thái 200 và thông tin sản phẩm đã cập nhật
    res.status(200).json({
      success: true,
      product,
    });
  });
  
  // Kiểm tra xem người dùng có thể đánh giá sản phẩm không  =>  /api/can_review
  export const canUserReview = catchAsyncErrors(async (req, res) => {
    // Tìm tất cả các đơn hàng của người dùng đó chứa sản phẩm có ID trùng với ID được truyền
    const orders = await Order.find({
      user: req.user._id,
      "orderItems.product": req.query.productId,
    });
  
    // Kiểm tra xem người dùng đã mua sản phẩm này chưa
    if (orders.length === 0) {
      // Nếu không có đơn hàng nào chứa sản phẩm này, trả về false với mã trạng thái 200
      return res.status(200).json({ canReview: false });
    }
  
    // Nếu có đơn hàng chứa sản phẩm này, trả về true với mã trạng thái 200
    res.status(200).json({
      canReview: true,
    });
  });


