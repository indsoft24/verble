import multer from 'multer';
import path from 'path';



// 1. Define a single file filter for all image types.
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error(`Error: File upload only supports the following filetypes - ${allowedTypes}`), false);
};

const memoryStorage = multer.memoryStorage();


const uploadBlogImage = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 
    }
});

export default uploadBlogImage;
