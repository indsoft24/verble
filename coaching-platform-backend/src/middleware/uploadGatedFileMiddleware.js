import multer from 'multer';

const fileFilterForDocuments = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/zip',
        'application/x-zip-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and ZIP files are allowed.'), false);
    }
};

const memoryStorage = multer.memoryStorage();

const uploadGatedFile = multer({
    storage: memoryStorage,
    fileFilter: fileFilterForDocuments,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export default uploadGatedFile;