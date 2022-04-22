import nextConnect from "next-connect";
import multer from 'multer'
import path from 'path'
import uploadToAzureStorage from  "../../../components/upload-to-azure-storage"


const upload = multer({
    storage: multer.diskStorage({
      destination: './public/uploads',
      filename: (req, file, cb) => cb(null, file.originalname+ Math.floor((new Date()).getTime() / 1000)+ path.extname(file.originalname)),
    }),
  });


const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.single("file"));

apiRoute.post((req, res) => {
  let url = 'http://' + req.headers.host
  let fileName = req.file.filename
  res.status(200).json({ message: 'success', url: `${url}/public/uploads/${fileName}` });
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};

