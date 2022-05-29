import azureStorage from 'azure-storage';
import intoStream from 'into-stream';
//import {getKey} from "../db/connect.js"


export default async function uploadToAzureStorage (request, response,AZURE_STORAGE_CONNECTION_STRING) {
    console.log(request)
    if (!request.files) {
        return response.status(400).send("No files are received.");
    }
    const containerName = "layerscontainer";
    const blobService = azureStorage.createBlobService(
        AZURE_STORAGE_CONNECTION_STRING
    );
    const blobName = request.files.file.name;
    // console.log(`Blob Name ${blobName}`);
    const stream = intoStream(request.files.file.data);
    // console.log(`stream ${stream}`);
    const streamLength = request.files.file.data.length;
    // console.log(`Length ${streamLength}`);
    blobService.createBlockBlobFromStream(
        containerName,
        blobName,
        stream,
        streamLength,
        (err) => {
            if (err) {
                response.status(500);
                response.send({ message: "Error Occured" });
                return;
            }

            var hostName = 'https://mystorageaccountname.blob.core.windows.net';
            var url = blobService.getUrl(containerName, request.files.file.name, null, hostName);

            // console.log(url)
            return response.status(200).json({
                message: 'File Uploaded Successfully',
                url: url
            });
        }
    );
}