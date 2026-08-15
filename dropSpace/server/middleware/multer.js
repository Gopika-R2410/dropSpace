import multer from "multer";

// Memory storage so the file buffer can be piped straight to Cloudinary
// without ever touching disk.
const storage = multer.memoryStorage();

const MAX_FILE_SIZE_MB = 50;

const fileFilter = (req, file, cb) => {
  const allowed = /^(image|video)\//;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
