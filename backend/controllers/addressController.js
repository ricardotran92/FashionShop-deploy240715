import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import ErrorHandler from "../utils/errorHandler.js";
import { createHmac } from "crypto";

import axios from "axios"; // npm install axios
import CryptoJS from "crypto-js"; // npm install crypto-js
import moment from "moment"; // npm install moment


export const getAddressData = catchAsyncErrors(async (req, res, next) => {

  const options = {
    method: "get",
    url: `https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json`,
  };
  const response = await axios(options);
  //console.log(response, response.status, response.data);
  res.status(response.status).json(response.data);
});