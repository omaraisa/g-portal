export default function uploadFile(req, res, __dirname) {

    let uploadedFile;
    let uploadPath;
    let fileName;
    // console.log(req.files)
    return new Promise((resolve, reject) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            reject('No files were uploaded.')
        }
        if(req.files.file.size > 5000000){
            reject('Uploaded file is too large')
        }
        else {
            fileName = new Date().getDate() + req.files.file.name ;
            // The name of the input field (i.e. "uploadedFile") is used to retrieve the uploaded file
            uploadedFile = req.files.file;
            uploadPath = __dirname + '/uploads/' + fileName;
            //fileURL = "http://127.0.0.1:" + port + "/uploads/" + uploadedFile.name;
            // Use the mv() method to place the file somewhere on your server
            uploadedFile.mv(uploadPath, function(err) {
                if (err)
                    reject(err);
    
                resolve(fileName);
            });
        }
        
        
    }).catch(err => {return err});
}
