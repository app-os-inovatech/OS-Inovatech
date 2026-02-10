const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Função para garantir que o diretório existe
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuração de storage para diferentes tipos de arquivo
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '../../uploads', destination);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, name + '-' + uniqueSuffix + ext);
    }
  });
};

// Filtro de arquivos por tipo
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|heic/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, HEIC)'));
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /jpeg|jpg|png|pdf/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens e PDF são permitidos'));
  }
};

const manualFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|pptx|jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas PDF, DOC, DOCX, PPT, PPTX e imagens são permitidos'));
  }
};

const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas vídeos (MP4, MOV, AVI, MKV, WEBM) são permitidos'));
  }
};

// Configurações específicas para cada tipo de upload
const uploadPhoto = multer({
  storage: createStorage('photos'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter
});

const uploadServicePhoto = multer({
  storage: createStorage('service-photos'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter
});

const uploadCertificate = multer({
  storage: createStorage('certificates'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFilter
});

const uploadManual = multer({
  storage: createStorage('manuals'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: manualFilter
});

const uploadVideo = multer({
  storage: createStorage('videos'),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: videoFilter
});

const voucherFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido para vouchers'));
  }
};

const uploadVoucher = multer({
  storage: createStorage('vouchers'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: voucherFilter
});

module.exports = {
  uploadPhoto,
  uploadServicePhoto,
  uploadCertificate,
  uploadManual,
  uploadVideo,
  uploadVoucher: uploadVoucher.single('arquivo')
};
