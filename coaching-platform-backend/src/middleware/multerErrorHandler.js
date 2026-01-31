import multer from "multer";

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "fail",
        message: `File is too large. Please upload a file under ${
          err.limit / 1024 / 1024
        }MB.`,
      });
    }
    return res.status(400).json({ status: "fail", message: err.message });
  }
  next(err);
};

export default multerErrorHandler;
