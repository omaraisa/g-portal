
import azureStorage from 'azure-storage';
import intoStream from 'into-stream';
import dotenv from 'dotenv';
dotenv.config();

const CONNECTION_STRING = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING;

export const config = {
    api: {
      bodyParser: false,
    },
  };

export default async function uploadToAzureStorage (request, response) {
    // console.log(request.files)
    if (!request.files) {
        return response.status(400).send("No files are received.");
    }
    const containerName = "layerscontainer";
    const blobService = azureStorage.createBlobService(
        CONNECTION_STRING
    );
    const blobName = request.files[0].filename;
    // console.log(`Blob Name ${blobName}`);
    const stream = intoStream(request.files[0].path);
    const streamLength = request.files[0].size;
    // console.log(`Length ${streamLength}`);
    blobService.createBlockBlobFromStream(
        containerName,
        blobName,
        // stream,
        streamLength,
        (err) => {
            if (err) {
                response.status(500);
                response.send({ message: "Error Occured" });
                return;
            }

            var hostName = 'https://mystorageaccountname.blob.core.windows.net';
            var url = blobService.getUrl(containerName, request.files[0].file.name, null, hostName);

            // console.log(url)
            return response.status(200).json({
                message: 'File Uploaded Successfully',
                url: url
            });
        }
    );
}