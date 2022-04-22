import nextConnect from "next-connect";
import multer from 'multer'
import path from 'path'
import express from 'express';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from "url";
// import UnzipShapefile from "../../../modules/upzip-shapefile.js";
// import shp2json from "../../../modules/shp2json.js"
// import uploadFile from "../../../modules/uploader.js"
import uploadToAzureStorage from  "../../../modules/upload-to-azure-storage"

const app = express()
// const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=mygportalstorage;AccountKey=YN69vZV3+29/kOO7CtrPqRUiA/vLtu33D0nviV//cl45cxW8GdYHY6zfTYqF26nvB7jjIe3CzN3Q+AStJYb8oQ==;EndpointSuffix=core.windows.net"


export const config = {
  api: { externalResolver: true }
}


const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// App configuration
app.use(express.static('public'))
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.urlencoded({ extended: false }))
    //app.use(bodyParse.urlencoded({ extended: true }))
app.use(
    fileUpload({
        createParentPath: true,
    })
);

app.post("/api/upload", (request, response) => {
  uploadToAzureStorage(request,response,AZURE_STORAGE_CONNECTION_STRING)
});

// app.post('/uploadshp', async(req, res) => {
//   res.json(await shp2json(await UnzipShapefile(await uploadFile(req, res, __dirname), __dirname, req, res), req, res))
// })


export default app;